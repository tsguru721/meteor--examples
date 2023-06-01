import React from 'react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { RoutePaths } from "./common/RoutePaths";
import { useNavigate } from "react-router-dom";
import { Select } from "./components/Fields/Select";
import { SortOptions } from "./common/SortOptions";

import {
  marketplaceAddress
} from '../../config'

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function HomePage() {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState([]);
  const [sortBy, setSortBy] = useState('oldest');
  const [loadingState, setLoadingState] = useState('not-loaded');
  const loadMoreInitialState = 4;
  const loadMoreIncrementSize = 4;
  const [loadMore, setLoadMore] = useState(loadMoreInitialState);
  useEffect(() => {
    loadNFTs();
  }, [sortBy, loadMore]);

  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider();
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider);
    const data = await contract.fetchMarketItems();

    /*
    *  map over items returned from smart contract and format
    *  them as well as fetch their token metadata
    */
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId);
      const meta = await axios.get(tokenUri);
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        name: meta.data.name,
        id: meta.data.id,
        description: meta.data.description,
      };

      return item;
    }));

    if (sortBy === 'oldest') {
      items.sort((a,b) => a.tokenId - b.tokenId); // b - a for reverse sort
    } else if (sortBy === 'newest') {
      items.sort((a,b) => b.tokenId - a.tokenId); // b - a for reverse sort
    } else if (sortBy === 'price-low') {
      items.sort((a,b) => a.price - b.price); // b - a for reverse sort
    } else if (sortBy === 'price-high') {
      items.sort((a,b) => b.price - a.price); // b - a for reverse sort
    }

    setNfts(items);
    setLoadingState('loaded');
  }

  return (
    <>
      <div className="bg-violet bg-bg-stars bg-auto bg-no-repeat bg-center-center py-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-big text-white font-bold">Fully functional NFT marketplace built with Meteor</h2>
          <p className="text-p font-light mt-5 text-white">Basic example of a digital marketplace for crypto collectibles and non-fungible tokens (NFTs). Buy, sell, and discover exclusive digital items.</p>
          <Button
            className="mt-8 mx-auto bg-rhino"
            text="Get Started for Free"
            onClick={() => {
              navigate(RoutePaths.SELL_NFT);
            }} />
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-16 pt-2.5 px-2 sm:px-6 lg:px-8">
        {(loadingState === 'loaded' && !nfts.length) ? (
          <h2 className="text-h2 text-rhino font-bold">No items in marketplace</h2>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-h2 text-rhino font-bold">All NFTs</h2>
              <Select onChange={e => {
                setSortBy(e.target.value);
                setLoadMore(loadMoreInitialState);
              }}>
                {SortOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 w-full container mx-auto">
              {nfts.slice(0, loadMore).map((nft) => (
                <Card key={nft.tokenId} itemImg={nft.image} itemName={nft.name} itemPrice={nft.price} itemId={nft.tokenId} />
              ))}
            </div>

            {loadMore < nfts.length && (
              <div className="mt-14 text-center">
                <Button
                  className="bg-dodger"
                  text="Load More"
                  onClick={() => {
                    setLoadMore(loadMore + loadMoreIncrementSize);
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
