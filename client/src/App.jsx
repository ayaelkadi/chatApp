import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Messages from "./pages/Messages";
import Chat from "./pages/Chat";
import Connections from "./pages/Connections";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Settings from "./pages/Settings";
import PostDetails from "./pages/PostDetails";
import Notification from "./pages/Notification";
import Layout from "./pages/Layout";
import Feed from "./pages/Feed";
import { useUser, useAuth } from "@clerk/clerk-react";
import Login from "./pages/Login";
import { Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "./features/user/userSlice";
import { fetchConnections } from "./features/connections/connectionsSlice";

const App = () => {
  const {user} = useUser()
  const {getToken} = useAuth()

  const dispatch = useDispatch()

  useEffect(()=> {
    const fetchData = async()=>{
   if(user){
      const  token = await getToken()
      dispatch(fetchUser(token))
      dispatch(fetchConnections(token))
    }
    }
    fetchData()
 
  }, [user, getToken, dispatch])
  return (
    <>
    <Toaster />
      <Routes>
        <Route path="/" element={!user ?<Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<Chat />} />
          <Route path="connections" element={<Connections />} />
          <Route path="search" element={<Search />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
          <Route path="settings" element={<Settings />} />
          <Route path="posts/:postId" element={<PostDetails />} />
          <Route path="notifications" element={<Notification />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
