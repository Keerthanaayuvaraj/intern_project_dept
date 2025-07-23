

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";
import { useNavigate } from 'react-router-dom';

const studentRepoTiles = [
  "Internships",
  "Placement",
  "Higher Education",
  "Competitive Exams",
  "Course",
  "Achievements (Co-Curriculum)",
  "Participation",
  "Extra-Curricular Activities",
];

const BACKEND_URL = "http://10.5.12.1:5000";

function StudentDashboard() {
  const [activeSection, setActiveSection] = useState("Student Repository");
  const [activeTile, setActiveTile] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploads, setUploads] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedItems, setSelectedItems] = useState({});
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [updateCgpaModal, setUpdateCgpaModal] = useState(false);
  const navigate = useNavigate();

  // Fetch profile data and achievements
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/studentlogin');
      return;
    }

    const fetchProfileAndData = async () => {
      try {
        // Fetch profile
        const profileRes = await fetch(`${BACKEND_URL}/api/student/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!profileRes.ok) throw new Error('Failed to fetch profile');
        
        const profileData = await profileRes.json();
        if (profileData.success) {
          setUserInfo({
            id: profileData.student._id,
            name: profileData.student.name,
            email: profileData.student.email,
            rollNumber: profileData.student.rollNumber,
            cgpa: profileData.student.cgpa,
            profilePhoto: profileData.student.profilePhoto
          });
          setCgpa(profileData.student.cgpa || '');
        }

        // Fetch achievements by category
        const promises = studentRepoTiles.map(async (category) => {
          const res = await fetch(`${BACKEND_URL}/achievements/${profileData.student._id}/${category}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            return { category, data };
          }
          return { category, data: [] };
        });
        
        const results = await Promise.all(promises);
        const newUploads = {};
        results.forEach(({ category, data }) => {
          newUploads[category] = data;
        });
        
        setUploads(newUploads);
      } catch (err) {
        console.error("Initial data fetch error:", err);
        if (err.message === 'Failed to fetch profile') {
          localStorage.removeItem('token');
          navigate('/studentlogin');
        }
      }
    };

    fetchProfileAndData();
  }, [navigate]);

  // Fetch data when active tile changes
  useEffect(() => {
    if (!activeTile || !userInfo?.id) return;

    const fetchAchievements = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/achievements/${userInfo.id}/${activeTile}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setUploads(prev => ({ ...prev, [activeTile]: data }));
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load achievements');
      }
    };
    
    fetchAchievements();
  }, [activeTile, userInfo?.id]);

  const validateDates = (fromDate, toDate) => {
    if (!fromDate) return true;
    if (!toDate) return true;
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return to >= from;
  };

  const handleSelect = (category, id) => {
    setSelectedItems((prev) => {
      const current = prev[category] || [];
      return {
        ...prev,
        [category]: current.includes(id)
          ? current.filter((i) => i !== id)
          : [...current, id],
      };
    });
  };

  const generateReportFromSelection = () => {
    const doc = new jsPDF();
    let y = 20;

    const drawBorder = () => {
      doc.setDrawColor(0);
      doc.rect(10, 10, 190, 277);
    };

    drawBorder();

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(`Student Achievement Report for ${userInfo?.name || 'Student'}`, 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text(`CGPA: ${cgpa || 'Not specified'}`, 105, y, { align: 'center' });
    y += 15;

    Object.entries(selectedItems).forEach(([category, ids]) => {
      const items = (uploads[category] || []).filter((item) => ids.includes(item._id));
      if (!items.length) return;

      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(category, 15, y);
      const textWidth = doc.getTextWidth(category);
      doc.line(15, y + 1, 15 + textWidth, y + 1);
      y += 10;

      items.forEach((item) => {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(`• ${item.title}${item.companyName ? ` at ${item.companyName}` : ''}`, 20, y);
        y += 6;
        doc.text(`From: ${new Date(item.fromDate).toLocaleDateString()} To: ${item.toDate ? new Date(item.toDate).toLocaleDateString() : 'Present'}`, 20, y);
        y += 6;

        doc.setFont("times", "normal");
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(item.shortDescription, 170);
        doc.text(splitText, 25, y);
        y += splitText.length * 5 + 3;

        if (y > 270) {
          doc.addPage();
          drawBorder();
          y = 20;
        }
      });

      y += 5;
    });

    doc.save(`${userInfo?.name || 'student'}_achievements_report.pdf`);
    setShowReportModal(false);
  };

  const generateFullReport = () => {
    const doc = new jsPDF();
    let y = 20;

    const drawBorder = () => {
      doc.setDrawColor(0);
      doc.rect(10, 10, 190, 277);
    };

    drawBorder();

    doc.setFont("times", "bold");
    doc.setFontSize(16);
    doc.text(`Complete Achievement Report for ${userInfo?.name || 'Student'}`, 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(12);
    doc.text(`CGPA: ${cgpa || 'Not specified'}`, 105, y, { align: 'center' });
    y += 15;

    Object.entries(uploads).forEach(([category, items]) => {
      if (!items.length) return;

      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(category, 15, y);
      const textWidth = doc.getTextWidth(category);
      doc.line(15, y + 1, 15 + textWidth, y + 1);
      y += 10;

      items.forEach((item) => {
        doc.setFont("times", "bold");
        doc.setFontSize(12);
        doc.text(`• ${item.title}${item.companyName ? ` at ${item.companyName}` : ''}`, 20, y);
        y += 6;
        doc.text(`From: ${new Date(item.fromDate).toLocaleDateString()} To: ${item.toDate ? new Date(item.toDate).toLocaleDateString() : 'Present'}`, 20, y);
        y += 6;

        doc.setFont("times", "normal");
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(item.shortDescription, 170);
        doc.text(splitText, 25, y);
        y += splitText.length * 5 + 3;

        if (y > 270) {
          doc.addPage();
          drawBorder();
          y = 20;
        }
      });

      y += 5;
    });

    doc.save(`${userInfo?.name || 'student'}_complete_achievements_report.pdf`);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    const form = e.target;
    const file = form.file.files[0];  
    const fromDate = e.target.fromDate.value;
    const toDate = e.target.toDate.value || null;

    if (toDate && !validateDates(fromDate, toDate)) {
      setError("End date cannot be before start date");
      return;
    }
    
    if (!file && !editingId) {
      setError("Please select a file");
      return;
    }

    if (file) {
      const validTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Only PDF, JPEG, and PNG files are allowed");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      let formData = new FormData();
      const jsonData = {
        title: form.title.value.trim(),
        description: form.description.value.trim(),
        fromDate: form.fromDate.value,
        toDate: form.toDate.value || null,
        shortDescription: form.shortDescription.value.trim(),
        category: activeTile
      };

      if (activeTile === 'Internships' || activeTile === 'Placement') {
        jsonData.companyName = form.companyName.value.trim();
      }

      if (file) {
        formData.append('file', file);
        Object.entries(jsonData).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const res = await fetch(
          editingId ? `${BACKEND_URL}/achievements/${editingId}` : `${BACKEND_URL}/upload`, 
          {
            method: editingId ? 'PUT' : 'POST',
            body: formData,
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!res.ok) throw new Error(editingId ? "Update failed" : "Upload failed");
        const data = await res.json();

        setUploads(prev => {
          const newUploads = { ...prev };
          if (editingId) {
            newUploads[activeTile] = newUploads[activeTile].map(item => 
              item._id === editingId ? data.achievement || data : item
            );
          } else {
            newUploads[activeTile] = [...(newUploads[activeTile] || []), data.achievement || data];
          }
          return newUploads;
        });
      } else {
        const res = await fetch(`${BACKEND_URL}/achievements/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(jsonData),
        });

        if (!res.ok) throw new Error("Update failed");
        const data = await res.json();

        setUploads(prev => ({
          ...prev,
          [activeTile]: prev[activeTile].map(item => 
            item._id === editingId ? data.achievement || data : item
          ),
        }));
      }

      setShowForm(false);
      setEditingId(null);
      form.reset();
    } catch (err) {
      console.error("Operation failed", err);
      setError(err.message || (editingId ? "Update failed" : "Upload failed") + ". Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        const res = await fetch(`${BACKEND_URL}/achievements/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!res.ok) throw new Error('Delete failed');

        setUploads(prev => {
          const updatedUploads = { ...prev };
          Object.keys(updatedUploads).forEach(category => {
            updatedUploads[category] = updatedUploads[category].filter(item => item._id !== id);
          });
          return updatedUploads;
        });

      } catch (err) {
        console.error("Delete failed", err);
        setError(err.message || "Delete failed. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleCgpaSave = async () => {
    if (cgpa === '' || cgpa < 0 || cgpa > 10) {
      alert('Please enter a valid CGPA (0-10)');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/student/cgpa`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ cgpa: Number(cgpa) })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update CGPA');
      }

      const data = await res.json();
      setUserInfo(prev => ({
        ...prev,
        cgpa: data.student.cgpa
      }));
      setCgpa(data.student.cgpa);
      alert(data.message || 'CGPA updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update CGPA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    /*if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }*/

    try {
      const res = await fetch(`${BACKEND_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      alert('Password changed successfully!');
      setShowProfileModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const renderProfileDropdown = () => (
    <div className="relative">
      <button 
        onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        className="flex items-center gap-2 hover:bg-gray-200 rounded-full p-1 transition"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
          {profilePhoto ? (
            <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-medium">
              {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
      </button>
      
      {showProfileDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-3 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                  <span className="text-xl font-medium">
                    {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                
              </div>
              <div>
                <p className="font-medium">{userInfo?.name}</p>
                <p className="font-medium">{userInfo?.rollNumber}</p>
                <p className="text-sm text-gray-500">{userInfo?.email}</p>
                <p className="text-sm text-gray-500">CGPA: {userInfo?.cgpa}</p>
              </div>
            </div>
          </div>
        
          <button
            onClick={() => {
              setShowProfileModal(true);
              setShowProfileDropdown(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Change Password
          </button>

          <button
          onClick={() => {
              setUpdateCgpaModal(true);
              setShowProfileDropdown(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Update CGPA
          </button>
          
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
         <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col relative overflow-hidden">

    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 p-6 relative overflow-auto">
        {/* Welcome and Profile Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-xl font-semibold">
            Welcome, {userInfo?.name || 'Student'}!
          </div>
          
            
            {renderProfileDropdown()}
      </div>
      <h1 className="text-3xl font-semibold mb-6">
          {activeTile || activeSection}
      </h1>

        {/* Tile View */}
        {activeSection === "Student Repository" && !activeTile && (
          <>
            <div className="flex justify-end mb-4 gap-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
              >
                Generate Selective Report
              </button>
              <button
                onClick={generateFullReport}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Generate Full Report
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {studentRepoTiles.map((title) => (
                <div
                  key={title}
                  className="bg-white rounded-xl shadow-md p-6 text-center text-lg font-medium hover:shadow-xl cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setActiveTile(title)}
                >
                  {title}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Upload View */}
        {activeTile && (
          <>
            <button
              className="mb-4 text-white bg-blue-500 p-2 rounded hover:bg-blue-700 transition-colors"
              onClick={() => setActiveTile(null)}
            >
              Back
            </button>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {(uploads[activeTile] || []).map((item, idx) => {
                const isImage = item.file?.contentType?.startsWith('image') || 
                              (item.fileType && item.fileType === 'image');

                return (
                  <div key={idx} className="bg-white shadow-md rounded-lg overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                    <div className="h-40 bg-gray-100 flex items-center justify-center">
                      {isImage ? (
                        <img
                          src={`${BACKEND_URL}/file/${item._id}`}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="text-gray-500 text-center text-sm">
                          <span className="text-6xl">📄</span>
                          <p>PDF Document</p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                      <h3 className="font-semibold text-xl text-center">{item.title}</h3>
                        <p className="text-sm text-gray-600">
                          <strong>Period:</strong> {new Date(item.fromDate).toLocaleDateString()} - 
                          {item.toDate ? new Date(item.toDate).toLocaleDateString() : 'Present'}
                        </p>
                        {item.companyName && (
                          <p className="text-sm text-gray-600">
                            <strong>Company:</strong> {item.companyName}
                          </p>
                        )}  
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <strong>Description:</strong> {item.description}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`${BACKEND_URL}/file/${item._id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-500 text-white rounded p-1 hover:bg-blue-700 transition-colors text-sm text-center"
                        >
                          View File
                        </a>
                        <button
                          onClick={() => handleEdit(item._id)}
                          className="flex-1 bg-yellow-500 text-white rounded p-1 hover:bg-yellow-600 transition-colors text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="flex-1 bg-red-500 text-white rounded p-1 hover:bg-red-600 transition-colors text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {uploads[activeTile]?.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-8">
                  No uploads yet. Click the + button to add one.
                </p>
              )}
            </div>

            <div className="fixed bottom-6 right-20 flex gap-4">
              <button
                className="bg-blue-500 font-bold text-white w-16 h-16 flex items-center justify-center rounded-full text-2xl shadow-2xl 
                          hover:bg-blue-600 hover:scale-110 transform transition duration-300 ease-in-out"
                onClick={() => {
                  setShowForm(true);
                  setEditingId(null);
                }}
                aria-label="Add new upload"
              >
                +
              </button>
            </div>
          </>
        )}

        {/* Report Selection Modal */}
        {showReportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white p-6 rounded-lg max-w-3xl w-full max-h-full overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Select Items for Report</h2>
              <div className="space-y-4">
                {studentRepoTiles.map((category) => {
                  const items = uploads[category] || [];
                  return (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-blue-600 mb-2">{category}</h3>
                      {items.length > 0 ? (
                        <div className="space-y-2 pl-4">
                          {items.map((item) => (
                            <label key={item._id} className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedItems[category]?.includes(item._id) || false}
                                onChange={() => handleSelect(category, item._id)}
                                className="mt-1"
                              />
                              <div>
                                <span>{item.title}</span>
                                {item.companyName && <span className="text-xs block">Company: {item.companyName}</span>}
                                <span className="text-xs text-gray-500 block">
                                  {new Date(item.fromDate).toLocaleDateString()} - {item.toDate ? new Date(item.toDate).toLocaleDateString() : 'Present'}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 pl-4">No items available.</p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setShowReportModal(false)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={generateReportFromSelection}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Settings Modal */}
        {showProfileModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                      <span className="text-2xl font-medium">
                          {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{userInfo?.name}</h3>
                    <p className="text-gray-600">{userInfo?.email}</p>
                    {userInfo?.rollNumber && (
                      <p className="text-gray-600">Roll No: {userInfo.rollNumber}</p>
                    )}
                  </div>
                </div>
                  
                <div className="space-y-4">
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-medium mb-3">Change Password</h3>
                    {passwordError && (
                      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                        {passwordError}
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                <div className="mt-6 flex justify-end gap-2">
                  <button 
                    onClick={() => setShowProfileModal(false)}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    onClick={handleChangePassword}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update CGPA Modal */}
        {updateCgpaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Update CGPA</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                      <span className="text-2xl font-medium">
                          {userInfo?.name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">{userInfo?.name}</h3>
                    <p className="text-gray-600">{userInfo?.email}</p>
                    {userInfo?.rollNumber && (
                      <p className="text-gray-600">Roll No: {userInfo.rollNumber}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CGPA (0-10)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={cgpa}
                    onChange={e => setCgpa(e.target.value)}
                    placeholder="Enter your CGPA"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    onClick={() => setUpdateCgpaModal(false)}
                    className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCgpaSave}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
            <form
              className="bg-white p-6 rounded-lg w-full max-w-md space-y-4"
              onSubmit={handleUpload}
            >
              <h2 className="text-xl font-semibold">
                {editingId ? "Edit Achievement" : "Upload Achievement"}
              </h2>
              
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <input 
                  type="text" 
                  name="title" 
                  placeholder="Title" 
                  required 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.title : ''}
                />
                <input 
                  type="text" 
                  name="description" 
                  placeholder="Description" 
                  required 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.description : ''}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                      type="date"
                      name="fromDate"
                      required
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.fromDate : ''}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                      type="date"
                      name="toDate"
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.toDate : ''}
                    />
                  </div>
                </div>

                {(activeTile === 'Internships' || activeTile === 'Placement') && (
                  <input
                    type="text"
                    name="companyName"
                    placeholder="Company Name"
                    required={activeTile === 'Internships' || activeTile === 'Placement'}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.companyName : ''}
                  />
                )}
                <input 
                  type="text" 
                  name="shortDescription" 
                  placeholder="Short Description (for report)" 
                  required 
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue={editingId ? uploads[activeTile]?.find(item => item._id === editingId)?.shortDescription : ''}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    File (PDF, JPG, PNG) {editingId && '(Leave empty to keep current file)'}
                  </label>
                  <input 
                    type="file" 
                    name="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    required={!editingId}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setError(null);
                  }} 
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingId ? "Updating..." : "Uploading..."}
                    </>
                  ) : editingId ? "Update" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

export default StudentDashboard;