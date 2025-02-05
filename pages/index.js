import { useState, useEffect, useRef, useContext } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";

import { Banner, Spinner } from "../components";
import { CreatorCard } from "../components";
import images from "../assets";
import { makeId } from "../utils/makeId";
import { NFTCard } from "../components/index";
import { NFTContext } from "../context/NFTContext";
import { SearchBar } from "../components";
import { getCreators } from "../utils/getTopCreators";
import { shortenAddress } from "../utils/shortenAddress";

const Home = () => {
  const [nfts, setNfts] = useState([]);
  const [nftsCopy, setNftsCopy] = useState([]);
  const [hideButtons, setHideButtons] = useState(false);
  const { theme } = useTheme();
  const parentRef = useRef(null);
  const scrollRef = useRef(null);
  const { fetchNFTs } = useContext(NFTContext);
  const [activeSelect, setActiveSelect] = useState("Recently Added");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNFTs().then((items) => {
      console.log("ITEMS:", items);
      setNfts(items);
      console.log("NFTS:", nfts);
      setNftsCopy(items);
      setIsLoading(false);
    });
  }, []);
  useEffect(() => {
    console.log("UPDATED NFTS:", nfts); // Now you'll see the updated NFTs here
  }, [nfts]);

  useEffect(() => {
    const sortedNfts = [...nfts];

    switch (activeSelect) {
      case "Price(Low to High)":
        setNfts(sortedNfts.sort((a, b) => a.price - b.price));
        break;

      case "Price(High to Low)":
        setNfts(sortedNfts.sort((a, b) => b.price - a.price));
        break;

      case "Recently Added":
        setNfts(sortedNfts.sort((a, b) => b.tokenId - a.tokenId));
        break;

      default:
        setNfts(nfts);
        break;
    }
  }, [activeSelect]);

  const onHandleSearch = (value) => {
    const filteredNfts = nfts.filter(({ name }) =>
      name.toLowerCase().includes(value.toLowerCase())
    );
    if (filteredNfts.length) {
      setNfts(filteredNfts);
    } else {
      //re-show all nfts
      setNfts(nftsCopy);
    }
  };

  const onClearSearch = () => {
    if (nfts.length && nftsCopy.length) {
      setNfts(nftsCopy);
    }
  };

  const handleScroll = (direction) => {
    const { current } = scrollRef;
    const scrollAmount = window.innerWidth > 1800 ? 270 : 210;

    if (direction === "left") {
      current.scrollLeft -= scrollAmount;
    } else {
      current.scrollLeft += scrollAmount;
    }
  };

  const isScrollable = () => {
    const { current } = scrollRef;
    const { current: parent } = parentRef;

    if (current?.scrollWidth >= parent?.offsetWidth) {
      setHideButtons(false);
    } else {
      setHideButtons(true);
    }
  };

  useEffect(() => {
    isScrollable();
    window.addEventListener("resize", isScrollable);
    return () => {
      window.removeEventListener("resize", isScrollable);
    };
  });

  const topCreators = getCreators(nftsCopy);

  console.log("TOP CREATORS:", topCreators);

  return (
    <div className="flex justify-center sm:px-4 p-12">
      <div className="w-full minmd:w-4/5">
        <Banner
          banner="Discover, collect, and sell extraordinary NFTs"
          childStyles="md:text-4xl sm:text-2xl xs:text-xl text-left"
          parentStyles="justify-start mb-6 h-72 sm:h-60 p-12 xs:p-4 xs:h-44 rounded-3xl"
        />
        {!isLoading && !nfts.length ? (
          <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
            That&apos;s weird.... No NFTs for sale!!!
          </h1>
        ) : isLoading ? (
          <Spinner />
        ) : (
          <>
            <div>
              <h1 className="font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold ml-4 xs:ml-0">
                Top Sellers
              </h1>
              <div
                className="relative flex-1 max-w-full flex mt-3"
                ref={parentRef}
              >
                <div
                  className="flex flex-row w-max overflow-x-scroll no-scrollbar select-none"
                  ref={scrollRef}
                >
                  {topCreators.map((creator, index) => (
                    <CreatorCard
                      key={creator.seller}
                      rank={index + 1}
                      creatorImage={images[`creator${index + 1}`]}
                      creatorName={shortenAddress(creator.seller)}
                      creatorEths={creator.sum}
                    />
                  ))}
                  {/* {[6, 7, 8, 9, 10].map((index) => (
              <CreatorCard
                key={`creator-${index}`}
                rank={index}
                creatorImage={images[`creator${index}`]}
                creatorName={`0x${makeId(3)}...${makeId(4)}`}
                creatorEths={10 - index * 0.5}
              />
            ))} */}

                  {!hideButtons && (
                    <>
                      <div
                        onClick={() => handleScroll("left")}
                        className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer left-0"
                      >
                        <Image
                          src={images.left}
                          layout="fill"
                          objectFit="contain"
                          alt="left_arrow"
                          className={theme === "light" && "filter invert"}
                        />
                      </div>
                      <div
                        onClick={() => handleScroll("right")}
                        className="absolute w-8 h-8 minlg:w-12 minlg:h-12 top-45 cursor-pointer right-0"
                      >
                        <Image
                          src={images.right}
                          layout="fill"
                          objectFit="contain"
                          alt="right_arrow"
                          className={theme === "light" && "filter invert"}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* created nfts */}
            <div className="mt-10">
              <div className="flexBetween mx-4 xs:mx-0 minlg:mx-8 sm:flex-col sm:items-start">
                <h1 className="flex-1 before:first:font-poppins dark:text-white text-nft-black-1 text-2xl minlg:text-4xl font-semibold sm:mb-4">
                  NFTs On Sale
                </h1>
                <div className="flex-2 sm:w-full flex flex-row sm:flex-col">
                  <SearchBar
                    activeSelect={activeSelect}
                    setActiveSelect={setActiveSelect}
                    handleSearch={onHandleSearch}
                    clearSearch={onClearSearch}
                  />
                </div>
              </div>
              <div className="mt-3 w-full flex flex-wrap justify-center md:justify-center">
                {nfts.map((nft) => {
                  // console.log(nft);
                  return <NFTCard key={nft.tokenId} nft={nft} />;
                })}
                {/* {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((index) => (
              <NFTCard
                key={`nft-${index}`}
                nft={{
                  index,
                  name: `Nifty NFT ${index}`,
                  price: (10 - index * 0.534).toFixed(2),
                  seller: `0x${makeId(3)}...${makeId(4)}`,
                  owner: `0x${makeId(3)}...${makeId(4)}`,
                  description: "cool NFT on sale",
                }}
              />
            ))} */}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
