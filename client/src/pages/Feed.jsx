import React from "react";
import logo from "../assets/logo.png";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import RecentMessages from "../components/RecentMessages";
import PostCard from "../components/PostCard";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios"
import toast from "react-hot-toast";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {getToken} = useAuth()


  const fetchFeeds = async ()=>{
    try {
      setLoading(true)
      const {data} = await api.get("/api/post/feed", {
        headers:{
          Authorization:`Bearer ${await getToken()}`
        }
      })
      console.log("aya", data)

      if(data.success){
        setFeeds(data.posts)
      }else{
        toast.error(error.message || "error")
      }
    } catch (error) {
      toast.error(error.message)
    }finally{
    setLoading(false)

    }

  }


  useEffect(()=>{
    fetchFeeds()
  },[])
  return !loading ?  (
    <div className="h-full overflow-y-scroll no-scrollbar py-10 xl:pr-5 flex flex-col items-center bg-gradient-to-bl  from-[#0b0f3b] via-[#1a1f4d] to-[#3c1f7f] text-white relative">
      <div className="w-[90%] flex justify-between items-center p-4 absolute top-1 z-50 right-4 rounded-3xl">
        <img
          src={logo}
          alt=""
          className="h-10 mr-3 hidden sm:block animate-pulse"
        />

        <div className="flex-1 mx-4 sm:ml-65 max-w-md">
          <input
            type="text"
            placeholder="search here..."
            className="w-full p-3 border rounded-3xl border-purple-500/30
             bg-white/5 text-white placeholder-purple-300 
             focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all "
          />
        </div>
        <div
          onClick={() => navigate("/notifications")}
          className="relative cursor-pointer p-3 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 shadow-[0_0_20px_rgba(255,0,255,0.5)] hover:scale-110 transition-transform"
        >
          <Bell className="w-6 h-6 text-white animate-pulse" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </div>
      </div>
      <div className="flex items-start justify-center xl:gap-8 w-full mt-20">
        <div className="w-full max-w-2xl">
          {/* Storiesbar */}
          <StoriesBar />
          <div className="p-4 space-y-6">{/* postcard */}

            {feeds.map((post)=> (
              <PostCard  key={post._id} post={post} className="bg-white/5 backdrop-blur-lg rounded-2xl shadow-[0_0_20px_rgba(255,0,255,0.5)] hover:scale-105
               hover:shadow-[0_0_25px_rgba(255,0,255,0.4)] transition-transform duration-300"/>
            ))}
          </div>
        </div>

        {/* messages suppl */}
        <div className="max-xl:hidden sticky top-2">
          <RecentMessages />

        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/10 to-indigo-400/10 mix-blend-overlay animate-pulse-slow">
      
      </div>
    </div>
  ): (
    <Loading />
  )
};

export default Feed;
