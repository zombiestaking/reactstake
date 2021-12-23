import React, { useState, useEffect } from "react";
import axios from "axios";
import { JsonRpc } from "eosjs";
import Page from "./Page";

const App = (props) => {
  const [loading, setLoading] = useState(false);
  const [nftcount, setNftCount] = useState(0);
  const [totalAccounts, setTotalAccounts] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [badCount, setBadCount] = useState(0);
  const [nftList, setNftList] = useState([]);
  const rpc = new JsonRpc("https://api.wax.alohaeos.com/", { fetch });

  const collName="talesofcrypt";
  const contract="shroomstaker";
  
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setNftCount(0);
      setAccountCount(0);
      setBadCount(0);
      const getNfts = async (lowerBound = "", result = []) => {
        const r = await rpc.get_table_rows({
          code: contract,
          scope: contract,
          table: "nfts",
          json: true,
          limit: 1000,
          lower_bound: lowerBound,
          upper_bound: "",
        });
        if (r.rows && r.rows.length > 0) {
          var z=[];
          r.rows.forEach(x => {
            if(x.pool==collName)
            {
              z.push(x);
            }
          });
          result = result.concat(z);
          setNftCount(result.length);
          const lb = parseInt(result[result.length - 1].asset_id) + 1;
          return getNfts(lb, result);
        } else {
          return result;
        }
      };

      const nfts = await getNfts();

      const groupBy = (arr, property) => {
        return arr.reduce((acc, cur) => {
          acc[cur[property]] = [...(acc[cur[property]] || []), cur];
          return acc;
        }, {});
      };

      const group = groupBy(nfts, "account");

      const entries = Object.entries(group);
      let final = [];
      setTotalAccounts(entries.length);
      for (let i = 0; i < entries.length; i++) {
        setAccountCount(i + 1);
        const badAssets = [];
        const [accountName, stakedNfts] = entries[i];
        const getAccountNfts = async (page = 1, result = []) => {
          try {
            const r = await axios.get(
              "https://wax.api.atomicassets.io/atomicassets/v1/assets?collection_name="+collName+
              "&owner=" +
                accountName +
                "&page=" +
                page +
                "&limit=1000&order=desc&sort=asset_id"
            );
            await new Promise((r) => setTimeout(r, 200));
            result = r.data.data ? result.concat(r.data.data) : result;
            if (r.data.data.length === 1000) {
              return getAccountNfts(page + 1, result);
            } else {
              console.log(result);
              return result;
            }
          } catch (e) {
            console.log(e);
            await new Promise((r) => setTimeout(r, 5000));
            return getAccountNfts(page, result);
          }
        };
        const accountNfts = await getAccountNfts();
        stakedNfts.forEach((x) => {
          const ii = accountNfts.findIndex((y) => y.asset_id === x.asset_id);
          if (ii < 0) badAssets.push(x.asset_id);
        });
        console.log(accountName);
        console.log(badAssets);
        setBadCount((old) => old + badAssets.length);
        final = final.concat(badAssets);
      }

      setNftList(final);
      setLoading(false);
    };
    run();
  }, []);

  const renderTextareas = (assets) => {
    let all = [];
    let chunk = [];
    const _assets = [...assets];
    while (_assets.length > 0) {
      chunk = _assets.splice(0, 500);
      all.push(chunk);
    }
    return <div>{all.map((x, i) => renderTextarea(x, i))}</div>;
  };

  const renderTextarea = (a, i) => {
    return (
      <div
        key={"textarea-" + i}
        style={{
          border: "4px solid transparent",
          display: "inline-block",
        }}
      >
        <textarea
          readOnly={true}
          onClick={() => {
            navigator.clipboard.writeText(
              JSON.stringify(a).replace(/['"]+/g, "")
            );
          }}
          onFocus={(event) => event.target.select()}
          style={{
            width: "320px",
            height: "320px",
            resize: "none",
            cursor: "pointer",
          }}
          value={JSON.stringify(a).replace(/['"]+/g, "")}
        />
      </div>
    );
  };

  return (
    <Page title= "Transferred/Burnt IDs">
      <h2>Transferred/Burnt IDs</h2>
      {loading ? (
        <div>
          <div>NFTs in table: {nftcount}</div>
          <br />
          <div>
            Accounts checked: {accountCount} / {totalAccounts}
          </div>
          <br />
          <div>NFTs to remove: {badCount}</div>
          <div>
          </div>
        </div>
      ) : (
        <div>{renderTextareas(nftList)}</div>
      )}
      <br />
      <br />
    </Page>
  );
};

export default App;
