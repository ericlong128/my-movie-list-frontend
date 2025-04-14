import React, { useEffect, useState } from "react";
import "./watchlists.css";
import axios from "axios";
import { addFriend, getPublicWatchlists } from "../../utils/databaseCalls";
import RecommendIcon from "@mui/icons-material/Recommend";
import { decodeToken, userJwt } from "../../utils/jwt";
import { Link } from "react-router";

let API_KEY = import.meta.env.VITE_WATCHMODE_API_KEY;
const token = localStorage.getItem("token") || "";
const user = decodeToken(token) as userJwt;
const currentUsername = user?.username;

interface WatchlistData {
  listId: string;
  listName: string;
  userId: string;
  username: string;
  comments: string[];
  likes: string[];
  titles: string[];
  collaborators: string[];
}

interface TitleData {
  title: string;
  poster: string;
}

function watchlists() {

  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [titleMap, setTitleMap] = useState<Map<string, TitleData>>(new Map());
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getPublicWatchlists(); //await axios.get(`${BASE_URL}/watchlist/public`);

        const data = result?.data || [];
        setWatchlists(data);

        // Collect all unique title IDs
        const allIds = data.flatMap((wl: WatchlistData) => wl.titles);
        const uniqueIds = Array.from(new Set(allIds));

        console.log("unique Ids ", uniqueIds);

        const map = new Map<string, TitleData>();

        // Fetch all titles one by one from Watchmode API
        await Promise.all(
          uniqueIds.map(async (id) => {
            try {
              const res = await axios.get(
                `https://api.watchmode.com/v1/title/${id}/details/?apiKey=${API_KEY}`
              );
              map.set(id as string, {
                title: res.data.title || "Untitled",
                poster:
                  res.data.poster ||
                  "/src/assets/Images/default-title-image.png",
              });
            } catch {
              map.set(id as string, {
                title: "Unknown Title",
                poster: "/src/assets/Images/default-title-image.png",
              });
            }
          })
        );
        setTitleMap(map);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  const handleAddFriend = async (username: string) => {
    try {
      await addFriend(username);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Failed to send friend request:", error);
    }
  };

  const filteredWatchlists = watchlists.filter((wl) =>
    wl.listName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="public-watchlists-container">
      <div className="public-watchlists-header">
        <h1>Explore Public Watchlists</h1>
        <div className="search-section">
          <input
            type="text"
            placeholder="Search watchlists..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button">Search</button>
        </div>
      </div>

      {filteredWatchlists.length === 0 ? (
        <p style={{ marginTop: "2rem" }}>No watchlists found.</p>
      ) : (
        <div className="public-watchlist-grid">
          {filteredWatchlists.map((wl) => (
            <div key={wl.listId} className="public-watchlist-card">
              <h3 className="watchlist-name">{wl.listName}</h3>
              <p className="watchlist-username-container">
                <span className="watchlist-username">{wl.username}</span>
                {token && wl.username !== currentUsername && (
                  <button
                    className="add-friend-button"
                    onClick={() => handleAddFriend(wl.username)}
                  >
                    ➕ Add Friend
                  </button>
                )}
              </p>

              <div className="title-grid">
                {wl.titles.slice(0, 4).map((titleId, index) => {
                  const title = titleMap.get(titleId);
                  return (
                    <div key={index} className="title-cell">
                      <Link to={`/movieinformation/${titleId}`} className="title-link">
                        <img
                          src={
                            title?.poster ||
                            "/src/assets/Images/default-title-image.png"
                          }
                          alt={title?.title || "title"}
                          className="title-poster"
                        />
                        <p className="title-name">{title?.title || "Title"}</p>
                      </Link>
                    </div>
                  );
                })}
              </div>
              <p className="collaborators">
                <strong>Collaborators:</strong> {wl.collaborators.join(", ")}
              </p>

              <div className="likes-comments">
                <p>{wl.likes.length}<strong> Likes</strong></p>
                <p>{wl.comments.length}<strong> Comments</strong></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default watchlists;
