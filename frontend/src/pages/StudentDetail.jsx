
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSelectiveModal, setShowSelectiveModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const allCategories = [
    'Internships',
    'Placement',
    'Higher Education',
    'Competitive Exams',
    'Course',
    'Achievements (Co-Curriculum)',
    'Participation',
    'Extra-Curricular Activities',
  ];

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await api.get(`/students/${id}`);
        console.log('Student API Response:', res.data);
        setStudent(res.data);
      } catch (err) {
        console.error('Error fetching student:', err);
        setStudent(null);
      }
      setLoading(false);
    };
    fetchStudent();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/students/${student._id}/report`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_${student._id}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const handleDownloadSelectivePDF = async () => {
    try {
      if (!selectedCategories.length) {
        alert('Please select at least one category');
        return;
      }
      const response = await fetch(`/api/students/${student._id}/selective-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categories: selectedCategories })
      });
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_${student._id}_selective_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setShowSelectiveModal(false);
    } catch (err) {
      alert('Failed to download selective PDF');
    }
  };

  const formatDuration = (from, to) => {
    if (!from || !to) return 'N/A';
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const options = { year: 'numeric', month: 'short' };
    return `${fromDate.toLocaleDateString('en-US', options)} – ${toDate.toLocaleDateString('en-US', options)}`;
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!student) return <div className="p-8 text-red-500">Student not found.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 bg-gray-200 px-4 py-2 rounded">Back</button>
      <h1 className="text-2xl font-bold mb-2">{student.name || 'Unnamed Student'}</h1>
      <div className="mb-2">Email: <span className="font-mono">{student.email || 'N/A'}</span></div>
      <div className="mb-2">Year of Study: {student.yearOfStudy || 'Not specified'}</div>
      <div className="mb-2">Batch: {student.batch || 'N/A'}</div>
      <div className="mb-2">CGPA: {student.cgpa !== '' ? student.cgpa : 'N/A'}</div>
      <div className="mb-2">Interned: {student.hasInterned ? 'Yes' : 'No'}</div>
      <div className="mb-2">Placed: {student.isPlaced ? 'Yes' : 'No'}</div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Achievements & Uploads</h2>
        {student.achievementsByCategory && Object.keys(student.achievementsByCategory).length > 0 ? (
          Object.entries(student.achievementsByCategory).map(([category, items]) => (
            <div key={category} className="mb-4">
              <h3 className="font-semibold text-blue-700 mb-1">{category}</h3>
              <ul className="list-disc ml-6">
                {items.map((a) => (
                  <li key={a._id} className="mb-2">
                    <div className="font-bold">
                      {a.title || 'Untitled'}
                      {a.fromDate && a.toDate && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({formatDuration(a.fromDate, a.toDate)})
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-700">{a.description || 'No description'}</div>
                    <div className="text-sm text-gray-500">{a.shortDescription || 'No short description'}</div>
                    {a.file && (
                      <a
                        href={`http://10.5.12.1:5000/file/${a._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline text-sm"
                      >
                        View Certificate/File
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <div className="text-gray-500">No uploads/achievements found.</div>
        )}
      </div>

      <button
        onClick={handleDownloadPDF}
        className="mt-4 inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        Download PDF Report
      </button>

      <button
        onClick={() => setShowSelectiveModal(true)}
        className="fixed bottom-10 right-10 px-6 py-3 rounded bg-green-500 text-white text-base font-semibold shadow-lg hover:bg-green-600 z-50 border-2 border-green-700 font-serif"
        title="Download Selective Report"
        style={{ fontFamily: 'Times New Roman, Times, serif', letterSpacing: '0.5px' }}
      >
        Download Selective Report
      </button>

      {showSelectiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
            <h2 className="text-xl font-semibold mb-2">Select Categories for Report</h2>
            <div className="space-y-2">
              {allCategories.map(cat => (
                <label key={cat} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={e =>
                      setSelectedCategories(sel =>
                        e.target.checked ? [...sel, cat] : sel.filter(c => c !== cat)
                      )
                    }
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowSelectiveModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDownloadSelectivePDF}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
