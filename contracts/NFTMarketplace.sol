//SPD-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ERC721URIStorage {
    // allows us to use the coutner utility.
    using Counters for Counters.Counter;

    // when the first token is minted it'll get a value of zero, the second one is one
    // and then using counters this we'll increment token ids
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    // fee to list an nft on the marketplace
    // charge a listing fee.
    uint listingPrice = 0.025 ether;

    //declaring the owner of the contract
    //owner earns a commision on every item sold
    address payable owner;

    //keeping up with all the items that have been created
    //to fetch a market item we only need the item id
    mapping(uint=>MarketItem) private idToMarketItem;

    struct MarketItem{
        uint tokenId;
        address payable seller;
        address payable owner;
        uint price;
        bool sold;
    }


    // have an event for when a market item is created.
    // this event matches the MarketItem
    event MarketItemCreated (
        uint indexed tokenId,
        address seller,
        address owner,
        uint price,
        bool sold
    );

    //sets the owner as the msg.sender
    //the owner of the contract is the one deploying it
    constructor() ERC721("Metaverse Tokens", 'METT') {
        owner = payable(msg.sender);
    }

    function updateListingPrice(uint _listingPrice) public payable{
        require(owner == msg.sender, "Only marketplace owner can update the listing price");
        listingPrice = _listingPrice;
    }

    
    /* Returns the listing price of the contract */
    // when we deploy the contract, on the frontend we don't know how much to list it for
    // so we call the contract and get the listing price and make sure we're sending the right amount of payment
    function getListingPrice() public view returns (uint){
        return listingPrice;
    }

    function createToken(string memory tokenURI, uint price) public payable returns (uint){
        _tokenIds.increment();

        // create a variable that get's the current value of the tokenIds
        uint newTokenId = _tokenIds.current();

        // mint the token with
        _mint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        createMarketItem(newTokenId, price);
        // we've just minted the token and made it sellable
         // now we can return the id to the client side so we can work with it
        return newTokenId;
    }

    function createMarketItem(uint tokenId, uint price) private {
        require(price>0, 'Price must be atleast 1 wei');
        require(msg.value== listingPrice, "Price must be equal to listing price");

        // create the mapping for the market items
      // payable(address(0)) is the owner.
      // currently there's no owner as the seller is putting it to market so it's an empty address
      // last value  is boolean for sold, its false because we just put it so it's not sold yet
      // this is creating the first market item
        idToMarketItem[tokenId] = MarketItem(
            tokenId,
            payable(msg.sender),
            payable(address(this)),
            price,
            false
        );

        // we now want to transfer the ownership of the nft to the contract -> next buyer
      // method available on IERC721
        _transfer(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
        tokenId,
        msg.sender,
        address(this),
        price,
        false
      );
    }


    /* allows someone to resell a token they have purchased */
    function resellToken(uint tokenId, uint price) public payable {
        require(idToMarketItem[tokenId].owner == msg.sender, "Only item owner can perform this operation");
        require(msg.value == listingPrice, "Price must be equal to listing price");

        idToMarketItem[tokenId].sold = false;
        idToMarketItem[tokenId].price = price;
        idToMarketItem[tokenId].seller = payable(msg.sender);
        idToMarketItem[tokenId].owner = payable(address(this));

        _itemsSold.decrement();
        _transfer(msg.sender, address(this), tokenId);
    }

    function createMarketSale(uint tokenId) public payable {
        require(idToMarketItem[tokenId].price == msg.value, "Please submit the asking price in order to complete the purchase");
        require(idToMarketItem[tokenId].seller != address(0), "NFT does not exist");
        require(!idToMarketItem[tokenId].sold, "NFT already sold");

        _transfer(address(this), msg.sender, tokenId);

        idToMarketItem[tokenId].owner = payable(msg.sender);
        idToMarketItem[tokenId].sold = true;
        address payable seller = idToMarketItem[tokenId].seller;
        idToMarketItem[tokenId].seller = payable(address(0));
        _itemsSold.increment();

        
        payable(owner).transfer(listingPrice);
        seller.transfer(msg.value);

    }

    function fetchMarketItems() public view returns(MarketItem[] memory){
        uint _itemCount = _tokenIds.current();
        uint unsoldCount = _itemCount - _itemsSold.current();
        uint currentIndex;
        MarketItem[] memory unsoldItems = new MarketItem[](unsoldCount);

        for(uint i=0; i<_itemCount; i++){
            if(idToMarketItem[i+1].owner == address(this)){
                MarketItem storage item = idToMarketItem[i+1];
                unsoldItems[currentIndex] = item;
                currentIndex++;
            }
        }

        return unsoldItems;
    }

    function fetchMyNFTs() public view returns(MarketItem[] memory){
        uint totalItems = _tokenIds.current();
        uint myItemCount;
        uint currentIndex;
        for(uint i=0; i<totalItems; i++){
            if(idToMarketItem[i+1].owner == msg.sender){
                myItemCount+=1;
            }
        }
        MarketItem[] memory myNFTs = new MarketItem[](myItemCount);

        for(uint i=0; i<totalItems; i++){
            if(idToMarketItem[i+1].owner == msg.sender){
                MarketItem storage myNFT = idToMarketItem[i+1];
                myNFTs[currentIndex] = myNFT;
                currentIndex++;
            }
        }

        return myNFTs;
    }

    function fetchItemsListed() public view returns(MarketItem[] memory){
        uint totalItems = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

      for (uint i = 0; i < totalItems; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          itemCount += 1;
        }
      }

      MarketItem[] memory listedItems = new MarketItem[](itemCount);
      for (uint i = 0; i < totalItems; i++) {
        if (idToMarketItem[i + 1].seller == msg.sender) {
          MarketItem storage currentItem = idToMarketItem[i+1];
          listedItems[currentIndex] = currentItem;
          currentIndex += 1;
        }
      }

      return listedItems;
    }

}

