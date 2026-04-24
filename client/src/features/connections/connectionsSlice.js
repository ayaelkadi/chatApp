import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/axios.js";


const initialState = {
    connections:[],
    pendingConnections:[],
    followers:[],
    following:[]
}


export const fetchConnections = createAsyncThunk(
  "connections/fetchConnections",

  async (token) => {
    const response  = await api.post(
      "/api/user/connections",{},
     
      { headers: { Authorization: `Bearer ${token}` } },
    );

    
    if(!response.data.success){
      return {
        connections: [],
        pendingConnections: [],
        followers: [],
        following: [],
      }
    }
   return response.data
  },
);

const connectionsSlice = createSlice({
    name:"connections",
    initialState,
    reducers:{

    },
    extraReducers:(builder)=>{
        builder.addCase(fetchConnections.fulfilled, (state,action)=>{
          
            state.connections = action.payload.connections || []
            state.pendingConnections = action.payload.pendingConnections || []
            state.followers = action.payload.followers || action.payload || []
            state.following = action.payload.following || []
        })
    }
})


export default connectionsSlice.reducer