
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUserCog } from 'react-icons/fa';

export default function Home() {
  const navigate = useNavigate();

  const teamMembers = [
    {
      name: 'Shevaani A',
      roll: '2023103598',
      image: '/images/sheva.jpg',
    },
    {
      name: 'Keerthanaa Y',
      roll: '2022103038',
      image: '/images/keerthu.jpg',
    },
    {
      name: 'Abirami R',
      roll: '2023103020',
      image: '/images/abi.jpg',
    },
    {
      name: 'Jenny Alice N',
      roll: '2023103613',
      image: '/images/jenny.jpg',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col relative overflow-hidden">

      {/* Background Circles Limited to Main Section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-56 h-56 bg-blue-200 opacity-30 rounded-full animate-pulseSlow"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 opacity-20 rounded-full animate-pulseSlow"></div>
      </div>

      {/* Main Content */}
      <div className="flex-grow flex flex-col items-center justify-center z-10 py-20 px-4 mt-[100px] relative">

        <h1 className="text-4xl font-extrabold text-blue-800 mb-4 drop-shadow-lg animate-fadeIn">
          Welcome to DCSE Achievements Repository
        </h1>

        <p className="text-gray-600 max-w-xl text-center mb-10 animate-fadeIn delay-200">
          Empowering students and administrators to manage academic and extracurricular achievements seamlessly.
        </p>

        <div className="flex flex-wrap justify-center gap-8 animate-fadeIn delay-300">
          <div
            onClick={() => navigate('/studentlogin')}
            className="bg-white bg-opacity-70 backdrop-blur-md shadow-xl rounded-xl p-8 w-72 cursor-pointer transition transform hover:scale-105 hover:shadow-blue-300 border border-blue-100"
          >
            <FaUserGraduate className="text-6xl text-blue-600 mb-4 mx-auto animate-bounceSlow" />
            <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded w-full">
              Student Login
            </button>
          </div>

          <div
            onClick={() => navigate('/adminlogin')}
            className="bg-white bg-opacity-70 backdrop-blur-md shadow-xl rounded-xl p-8 w-72 cursor-pointer transition transform hover:scale-105 hover:shadow-blue-300 border border-blue-100"
          >
            <FaUserCog className="text-6xl text-gray-700 mb-4 mx-auto animate-bounceSlow" />
            <button className="bg-gray-700 hover:bg-black text-white font-semibold py-2 px-6 rounded w-full">
              Admin Login
            </button>
          </div>
        </div>
      </div>
      <div className="absolute right-4 top-1/2 transform translate-y-[-50%] w-16 h-16 bg-blue-200 opacity-20 rounded-full animate-pulseSlow"></div>
      {/* Contributors Section */}
      <div className="w-full bg-blue-50 py-3 px-4 -mt-[35px] relative z-20">
        <h2 className="text-2xl font-bold text-center text-blue-800 mb-12">
          Our Contributors
        </h2>
        <div className="flex flex-wrap justify-center gap-12">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-white shadow-md rounded-xl p-6 w-64 hover:shadow-lg transition"
            >
              <div className="w-36 h-36 rounded-full overflow-hidden flex items-center justify-center mb-4 border-4 border-blue-100 bg-white">
                <img
                  src={member.image}
                  alt={member.name}
                  className={`object-cover object-top w-full h-full ${
                    (member.name.trim() === 'Abirami' || member.name.trim() === 'Jenny Alice N') ? 'scale-150' : ''
                  }`}
                />
              </div>
              <h3 className="font-semibold text-blue-700">{member.name}</h3>
              <p className="text-sm text-gray-600">{member.roll}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}