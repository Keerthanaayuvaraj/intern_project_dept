

import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaQuestionCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [step, setStep] = useState('login');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('http://10.5.12.1:5000/api/login/admin', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', 'admin');
      localStorage.setItem('userName', res.data.user?.name || 'Admin');
      localStorage.setItem('adminId', res.data.user?._id || res.data.user?.id);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col relative overflow-hidden">
{/* Background Circles Limited to Main Section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-56 h-56 bg-blue-200 opacity-30 rounded-full animate-pulseSlow"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 opacity-20 rounded-full animate-pulseSlow"></div>
      </div>
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="relative bg-white shadow-xl rounded-xl p-8 max-w-md w-full">

        {/* Tooltip Icon */}
        <div className="absolute top-2 right-2">
          <div className="group relative cursor-pointer text-gray-500">
            <FaQuestionCircle size={18} />
            <div className="absolute right-0 top-6 hidden w-64 text-xs bg-black text-white p-2 rounded shadow-lg group-hover:block z-10">
              Admin accounts are strictly managed. If you face login issues, please contact your system administrator directly for access or password reset.
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">
          {step === 'login'
            ? 'Admin Login'
            : step === 'forgot'
            ? 'Forgot Password'
            : step === 'verify'
            ? 'Verify OTP'
            : 'Reset Password'}
        </h2>

        {message && <div className="text-green-600 mb-4">{message}</div>}
        {error && <div className="text-red-600 mb-4">{error}</div>}

        {step === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />

            {/* Password Field with Eye Icon */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border p-2 rounded pr-10"
                required
              />
              <div
                className="absolute top-2 right-2 text-gray-600 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Login
            </button>
            <p className="text-sm text-blue-600 cursor-pointer text-center" onClick={() => setStep('forgot')}>
              Forgot password?
            </p>
          </form>
        )}

        {step === 'forgot' && (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Enter your admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button onClick={() => sendOtp()} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Send OTP
            </button>
            <p className="text-sm text-gray-600 text-center cursor-pointer" onClick={() => setStep('login')}>
              Back to login
            </p>
          </div>
        )}

        {step === 'verify' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button onClick={() => verifyOtp()} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">
              Verify OTP
            </button>
          </div>
        )}

        {step === 'reset' && (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border p-2 rounded"
              required
            />
            <button
              onClick={() => resetPassword()}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            >
              Reset Password
            </button>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminLogin;
