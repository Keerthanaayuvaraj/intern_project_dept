
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [registerType, setRegisterType] = useState('student'); // student, bulk-student, admin
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    startOfStudy: '',
    endOfStudy: '',
    batch: '',
    rollNumber: ''
  });
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    empNumber: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const formatMonthYear = (value) => {
    if (!value) return '';
    const [year, month] = value.split('-');
    return `${month}/${year}`;
  };

  const generateStudentPassword = (rollNumber) => {
    const last4 = rollNumber.slice(-4);
    return `CegStud@${last4}`;
  };

  const generateAdminPassword = (empNumber) => {
    const last4 = empNumber.slice(-4);
    return `CegAdmin@${last4}`;
  };

  const handleStudentChange = (e) => {
    setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  };

  const handleAdminChange = (e) => {
    setAdminForm({ ...adminForm, [e.target.name]: e.target.value });
  };

  const handleStudentRegister = async (e) => {
    e.preventDefault();
    setError('');

   
const startDate = new Date(`${studentForm.startOfStudy}-01`); // "YYYY-MM" to Date
const endDate = new Date(`${studentForm.endOfStudy}-01`);
const yearOfStudy = `${formatMonthYear(studentForm.startOfStudy)} - ${formatMonthYear(studentForm.endOfStudy)}`;
const password = generateStudentPassword(studentForm.rollNumber);
const payload = {
  name: studentForm.name,
  email: studentForm.email,
  password,
  startOfStudy: startDate,
  endOfStudy: endDate,
  yearOfStudy,  // optional, for display (e.g., "07/2021 - 06/2025")
  batch: studentForm.batch,
  rollNumber: studentForm.rollNumber
};

    try {
      await axios.post('/api/register/student', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert(`Student registered! Temp Password: ${password}`);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Student registration failed');
    }
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    setError('');

    const password = generateAdminPassword(adminForm.empNumber);

    const payload = {
      name: adminForm.name,
      email: adminForm.email,
      emp_no: adminForm.empNumber,
      password
    };

    try {
      await axios.post('/api/register/admin', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      alert(`Admin registered! Temp Password: ${password}`);
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Admin registration failed');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('Please select an Excel file.');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await axios.post('/api/register/students-bulk', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      alert('Students uploaded successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'File upload failed.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col relative overflow-hidden">
{/* Background Circles Limited to Main Section */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-56 h-56 bg-blue-200 opacity-30 rounded-full animate-pulseSlow"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-300 opacity-20 rounded-full animate-pulseSlow"></div>
      </div>
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setRegisterType('student')}
          className={`p-2 rounded ${registerType === 'student' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
        >
          Single Student
        </button>
        <button
          onClick={() => setRegisterType('bulk-student')}
          className={`p-2 rounded ${registerType === 'bulk-student' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
        >
          Bulk Student Upload
        </button>
        <button
          onClick={() => setRegisterType('admin')}
          className={`p-2 rounded ${registerType === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
        >
          Admin
        </button>
      </div>

      {registerType === 'student' && (
        <form onSubmit={handleStudentRegister} className="bg-white p-8 rounded shadow-md w-80">
          <h2 className="text-xl font-bold mb-4">Register Student</h2>

          <input name="name" type="text" placeholder="Name" value={studentForm.name} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />
          <input name="email" type="email" placeholder="Email" value={studentForm.email} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />

          <label className="mb-1 font-semibold">Start of Study</label>
          <input type="month" name="startOfStudy" value={studentForm.startOfStudy} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />

          <label className="mb-1 font-semibold">End of Study</label>
          <input type="month" name="endOfStudy" value={studentForm.endOfStudy} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />

          <input name="batch" type="text" placeholder="Batch (e.g. N, P, Q)" value={studentForm.batch} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />
          <input name="rollNumber" type="text" placeholder="Roll Number" value={studentForm.rollNumber} onChange={handleStudentChange} required className="mb-4 w-full p-2 border rounded" />

          {error && <div className="text-red-500 mb-2">{error}</div>}

          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
            Register Student
          </button>
        </form>
      )}

      {registerType === 'bulk-student' && (
        <form onSubmit={handleFileUpload} className="bg-white p-8 rounded shadow-md w-80">
          <h2 className="text-xl font-bold mb-4">Upload Students Excel File</h2>

          <input type="file" accept=".xlsx, .xls" onChange={e => setFile(e.target.files[0])} className="mb-4 w-full p-2 border rounded" />

          {error && <div className="text-red-500 mb-2">{error}</div>}

          <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
            Upload File
          </button>
        </form>
      )}

      {registerType === 'admin' && (
        <form onSubmit={handleAdminRegister} className="bg-white p-8 rounded shadow-md w-80">
          <h2 className="text-xl font-bold mb-4">Register Admin</h2>

          <input name="name" type="text" placeholder="Name" value={adminForm.name} onChange={handleAdminChange} required className="mb-4 w-full p-2 border rounded" />
          <input name="email" type="email" placeholder="Email" value={adminForm.email} onChange={handleAdminChange} required className="mb-4 w-full p-2 border rounded" />
          <input name="empNumber" type="text" placeholder="Employee Number" value={adminForm.empNumber} onChange={handleAdminChange} required className="mb-4 w-full p-2 border rounded" />

          {error && <div className="text-red-500 mb-2">{error}</div>}

          <button type="submit" className="w-full bg-purple-500 text-white p-2 rounded hover:bg-purple-600">
            Register Admin
          </button>
        </form>
      )}
    </div>
    </div>
  );
};

export default Register;
