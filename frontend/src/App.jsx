
import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import StudentLogin from './pages/StudentLogin';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';  
import StudentDashboard from './pages/StudentDashboard';
import Register from './pages/Register';
import StudentDetail from './pages/StudentDetail';
import Home from './pages/Home';


function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/studentlogin" element={<StudentLogin />} />
        <Route path="/adminlogin" element={<AdminLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/student/:id" element={<StudentDetail />} />
      </Routes>
  );
}

export default App;