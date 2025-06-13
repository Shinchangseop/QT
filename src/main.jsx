// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Signup from './Signup.jsx';
import Join from './Join.jsx';
import Edit from './Edit.jsx';
import EditNew from './EditNew.jsx';
import { GoogleOAuthProvider } from '@react-oauth/google';
import DiscordCallback from './DiscordCallback.jsx';
import EditList from './EditList';
import SinglePlay from "./SinglePlay.jsx";
import SingleScore from './SingleScore'; 
import Room from './Room.jsx';
import MultiPlay from './MultiPlay.jsx';
import MultiScore from './multiscore';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="708374970357-2vuikudvhcf8862t3oplijnt2lmd87mq.apps.googleusercontent.com">
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<App />} />
          <Route path='/signup' element={<Navigate to="/" replace />} />
          <Route path='/join' element={<Join />} />
          <Route path='/edit' element={<Edit />} />
          <Route path='/edit/new' element={<EditNew />} />
          <Route path="/discord/callback" element={<DiscordCallback />} />
          <Route path="/edit/list" element={<EditList />} />
          <Route path="/edit/:quizId" element={<EditNew isEditMode={true} />} />
          <Route path="/single/:quizId/:count/:time/:hint" element={<SinglePlay />} />
          <Route path="/single/score" element={<SingleScore />} />
          <Route path="/room/:roomId" element={<Room />} />
          <Route path="/multi/:roomId" element={<MultiPlay />} />
          <Route path="/multiscore" element={<MultiScore />} />
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
