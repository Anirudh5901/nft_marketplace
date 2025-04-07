require("dotenv").config();
import React, { useState, useEffect } from "react";
import axios from "axios";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

import { MarketAddress, MarketAddressABI } from "./contsants";

const fetchContract = (signerOrProvider) =>
  new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    const accounts = await window.ethereum.request({ method: "eth_accounts" });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log("No accounts found");
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask");

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setCurrentAccount(accounts[0]);
    window.location.reload();
  };

  // 🔥 Upload to Pinata IPFS
  const uploadToIPFS = async (file) => {
    const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
    const apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET;

    if (!apiKey || !apiSecret) {
      console.error("Missing Pinata API credentials");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const pinataOptions = JSON.stringify({
      cidVersion: 1,
    });

    formData.append("pinataOptions", pinataOptions);

    try {
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            pinata_api_key: apiKey,
            pinata_secret_api_key: apiSecret,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const ipfsHash = res.data.IpfsHash;
      const url = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      console.log("Uploaded to IPFS:", url);

      return url;
    } catch (error) {
      console.error("Error uploading file to Pinata:", error);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    console.log("Create NFT called");

    const { name, description, price } = formInput;
    if (!name || !description || !price || !fileUrl) return;

    const metadata = {
      name,
      description,
      image: fileUrl,
    };

    try {
      // 🔥 Get Pinata API keys from .env
      const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET;

      if (!apiKey || !apiSecret) {
        console.error("Missing Pinata API credentials");
        return;
      }

      // 🔹 Upload JSON metadata to Pinata
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        metadata, // No FormData, just plain JSON
        {
          headers: {
            pinata_api_key: apiKey,
            pinata_secret_api_key: apiSecret,
            "Content-Type": "application/json",
          },
        }
      );

      const ipfsHash = res.data.IpfsHash;
      const metadataUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      // 🔥 Now create NFT sale
      await createSale(metadataUrl, price);
      router.push("/");
    } catch (error) {
      console.error("Error uploading metadata to Pinata:", error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(connection);
      const signer = provider.getSigner();
      const balance = await signer.getBalance();
      console.log("Signer Address:", await signer.getAddress());
      console.log("Account Balance (ETH):", ethers.utils.formatEther(balance));

      const price = ethers.utils.parseUnits(formInputPrice, "ether");
      const contract = fetchContract(signer);
      console.log("Contract Address:", contract.address);

      const listingPrice = await contract.getListingPrice();
      console.log(
        "Listing Price (ETH):",
        ethers.utils.formatEther(listingPrice)
      );
      console.log("Value to Send (wei):", listingPrice.toString());

      if (balance.lt(listingPrice)) {
        console.error("Insufficient funds for listing price");
        return;
      }

      const transaction = !isReselling
        ? await contract.createToken(url, price, {
            value: listingPrice,
            gasLimit: 500000, // Explicit gas limit
          })
        : await contract.resellToken(id, price, {
            value: listingPrice,
            gasLimit: 500000, // Explicit gas limit
          });
      console.log("Transaction Sent:", transaction.hash);

      await transaction.wait();
      console.log("Transaction Confirmed!");
    } catch (error) {
      console.error("Error in createSale:", error);
      if (error.data) console.error("Error Data:", error.data);
      throw error;
    }
  };

  const fetchNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL
    );
    const contract = fetchContract(provider);
    //we want to fetch all the nfts on the marketplace not from a specific signer,
    //hence provider passed into fetchContract
    //JsonRpcProvider: Helps interact with the blockchain and get info
    const data = await contract.fetchMarketItems(); //array of promises that contain our nft's data
    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        //get all the promises
        //map over each one
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { image, name, description },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(
          unformattedPrice.toString(),
          "ether"
        );
        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      })
    );

    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    const data =
      type === "fetchItemsListed"
        ? await contract.fetchItemsListed()
        : await contract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        //get all the promises
        //map over each one
        const tokenURI = await contract.tokenURI(tokenId);
        const {
          data: { image, name, description },
        } = await axios.get(tokenURI);
        const price = ethers.utils.formatUnits(
          unformattedPrice.toString(),
          "ether"
        );
        return {
          price,
          tokenId: tokenId.toNumber(),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      })
    );

    return items;
  };

  const buyNFT = async (nft) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price,
    });

    await transaction.wait();
  };

  return (
    <NFTContext.Provider
      value={{
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
        createSale,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};
