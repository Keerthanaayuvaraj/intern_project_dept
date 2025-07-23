import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const batches = ['N', 'P', 'Q'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};



  const allExportFields = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'rollNumber', label: 'Roll Number' },
    { key: 'yearOfStudy', label: 'Year of Study' },
    { key: 'batch', label: 'Batch' },
    { key: 'cgpa', label: 'CGPA' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'Internships', label: 'Internship (Companies)' },
    { key: 'Placement', label: 'Placement (Companies)' },
    { key: 'Higher Education', label: 'Higher Education' },
    { key: 'Competitive Exams', label: 'Competitive Exams' },
    { key: 'Course', label: 'Courses' },
    { key: 'Achievements (Co-Curriculum)', label: 'Achievements (Co-Curriculum)' },
    { key: 'Participation', label: 'Participation' },
    { key: 'Extra-Curricular Activities', label: 'Extra-Curricular Activities' }
  ];
  const [appliedFilters, setAppliedFilters] = useState(null);

  const [filters, setFilters] = useState({
    fromYear: '',
    toYear: '',
    batch: '',
    hasInterned: false,
    isPlaced: false,
    isHigherEd: false,
    isCompExam: false,
    isCourse: false,
    isAchievement: false,
    isParticipation: false,
    isExtraC: false,
    cgpaMin: '',
    search: ''
  });
  // Calculate activeCategories only once — outside render loop
const activeCategories = [];
if (appliedFilters?.hasInterned) activeCategories.push('Internships');
if (appliedFilters?.isPlaced) activeCategories.push('Placement');
if (appliedFilters?.isHigherEd) activeCategories.push('Higher Education');
if (appliedFilters?.isCompExam) activeCategories.push('Competitive Exams');
if (appliedFilters?.isCourse) activeCategories.push('Course');
if (appliedFilters?.isAchievement) activeCategories.push('Achievements (Co-Curriculum)');
if (appliedFilters?.isParticipation) activeCategories.push('Participation');
if (appliedFilters?.isExtraC) activeCategories.push('Extra-Curricular Activities');

const staticCols = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'rollNumber', label: 'Roll' },
  { key: 'yearOfStudy', label: 'Year' },
  { key: 'batch', label: 'Batch' },
  { key: 'cgpa', label: 'CGPA' },
];

const dynamicCols = activeCategories.flatMap(cat => [
  { key: `${cat}_company`, label: `${cat}` },
  { key: `${cat}_timeline`, label: `${cat} (Timeline)` },
]);

const allCols = [...staticCols, ...dynamicCols];

  const [selectedExportFields, setSelectedExportFields] = useState(
    allExportFields.map(f => f.key)
  );

  const buildParams = () => {
    const params = {
      hasInterned: filters.hasInterned,
      isPlaced: filters.isPlaced,
      isHigherEd: filters.isHigherEd,
      isCompExam: filters.isCompExam,
      isCourse: filters.isCourse,
      isAchievement: filters.isAchievement,
      isParticipation: filters.isParticipation,
      isExtraC: filters.isExtraC,
    };
    if (filters.fromYear) params.fromYear = filters.fromYear;
    if (filters.toYear) params.toYear = filters.toYear;
    if (filters.batch) params.batch = filters.batch;
    if (filters.cgpaMin) params.cgpaMin = filters.cgpaMin;
    if (filters.search) params.search = filters.search;
    return params;
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/students', { params: buildParams() });
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleToggleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.checked });
  };


  const handleApplyFilters = (e) => {
  e.preventDefault();
  setAppliedFilters({ ...filters }); // snapshot current filters
  fetchStudents();
};

  const handleDownloadZip = () => {
      const queryParams = new URLSearchParams(buildParams()).toString();
      const token = localStorage.getItem('token');

      fetch(`/api/students/documents/zip?${queryParams}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(response => {
          if (!response.ok) throw new Error('Failed to download ZIP file');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', 'StudentAchievemnets.zip');
          document.body.appendChild(link);
          link.click();
          link.remove();
        })
        .catch(err => {
          console.error('ZIP Download Failed', err);
          alert('Failed to download internship documents');
        });
    };

  const handleDownloadExcel = () => {
    const queryParams = new URLSearchParams({
      ...buildParams(),
      columns: selectedExportFields.join(',')
    }).toString();

    const token = localStorage.getItem('token');

    fetch(`/api/students/report/excel?${queryParams}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to download file');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Student_Report.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        setShowExportOptions(false);
      })
      .catch(error => {
        console.error('Export failed', error);
      });
  };

  return (
     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col relative overflow-hidden">
    
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="flex justify-between items-center mb-6">
  <div></div> {/* empty div to push buttons right */}
  <div className="flex gap-4">
    <button
      onClick={() => navigate('/register')}
      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      Register
    </button>
    <button
      onClick={() => {
        localStorage.clear();
        navigate('/'); // or your admin login route
      }}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
    >
      Logout
    </button>
  </div>
</div>

      <form className="mb-4" onSubmit={handleApplyFilters}>
        <div className="flex gap-4 mb-2 flex-wrap">
          <input
            name="search"
            type="text"
            placeholder="Search by name/email/roll"
            value={filters.search}
            onChange={handleInputChange}
            className="p-2 border rounded"
          />

  {/* From Month & Year */}
<div className="flex items-center gap-2">
  <label>From (Month & Year):</label>
  <DatePicker
    selected={filters.fromYear ? new Date(filters.fromYear) : null}
    onChange={(date) => {
      const formatted = date
  ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  : '';

      setFilters(prev => ({ ...prev, fromYear: formatted }));
    }}
    showMonthYearPicker
    dateFormat="MM/yyyy"
    placeholderText="Select Month & Year"
    className="p-2 border rounded w-40"
    isClearable
  />
</div>

{/* To Month & Year */}
<div className="flex items-center gap-2">
  <label>To (Month & Year):</label>
  <DatePicker
    selected={filters.toYear ? new Date(filters.toYear) : null}
    onChange={(date) => {
      const formatted = date
  ? `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`
  : '';

      setFilters(prev => ({ ...prev, toYear: formatted }));
    }}
    showMonthYearPicker
    dateFormat="MM/yyyy"
    placeholderText="Select Month & Year"
    className="p-2 border rounded w-40"
    isClearable
  />
</div>


          <select name="batch" value={filters.batch} onChange={handleInputChange} className="p-2 border rounded">
            <option value="">Batch</option>
            {batches.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {[['hasInterned', 'Internship'], ['isPlaced', 'Placement'], ['isHigherEd', 'Higher Education'], ['isCompExam', 'Competitive Exams'], ['isCourse', 'Course'], ['isAchievement', 'Achievements (Co-Curriculum)'], ['isParticipation', 'Participation'], ['isExtraC', 'Extra-Curricular Activities']].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                name={key}
                checked={filters[key]}
                onChange={handleToggleChange}
              />
              {label}
            </label>
          ))}

          <input
            name="cgpaMin"
            type="number"
            step="0.01"
            placeholder="CGPA above"
            value={filters.cgpaMin}
            onChange={handleInputChange}
            className="p-2 border rounded w-32"
          />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Apply Filters
          </button>
          <button
            type="button"
            onClick={() => setShowExportOptions(true)}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Export to Excel
          </button>
          <button
            type="button"
            onClick={handleDownloadZip}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            Download Internship Docs ZIP
          </button>
          <button
  type="button"
  onClick={() => {
    const resetFilters = {
      fromYear: '',
      toYear: '',
      batch: '',
      hasInterned: false,
      isPlaced: false,
      isHigherEd: false,
      isCompExam: false,
      isCourse: false,
      isAchievement: false,
      isParticipation: false,
      isExtraC: false,
      cgpaMin: '',
      search: ''
    };

    setFilters(resetFilters);
    setAppliedFilters(resetFilters);

    // ✅ Directly fetch all students without filters:
    api.get('/students')
      .then(res => setStudents(res.data))
      .catch(() => setStudents([]));

  }}
  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
>
  Reset Filters
</button>
        </div>
      </form>

      {showExportOptions && (
        <div className="mt-6 bg-gray-100 border border-gray-300 rounded p-4">
          <h2 className="font-semibold text-lg mb-2">Select Fields to Export</h2>
          <div className="flex flex-wrap gap-4">
            {allExportFields.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedExportFields.includes(key)}
                  onChange={() => {
                    setSelectedExportFields(prev =>
                      prev.includes(key)
                        ? prev.filter(f => f !== key)
                        : [...prev, key]
                    );
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={handleDownloadExcel}
            >
              Confirm Export
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              onClick={() => setShowExportOptions(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded shadow p-4 overflow-x-auto mt-6">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                {allCols.map(col => (
                  <th key={col.key} className="px-4 py-2">{col.label}</th>
                ))}
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>

            <tbody>
      {students.map((student) => {
        return (
          <tr key={student._id} className="border-t">
            {/* Static fields */}
            {staticCols.map(col => (
              <td key={col.key} className="px-4 py-2">{student[col.key]}</td>
              
            ))}
            

            {/* Dynamic category fields */}
            {activeCategories.flatMap(cat => {
              const data = student.achievementsByCategory?.[cat] || [];

              const companies = data.map(d => d.companyName || d.title).join(', ') || '-';

              const timeline = data.map(d => {
                const from = d.fromDate ? new Date(d.fromDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
                const to = d.toDate ? new Date(d.toDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';
                return from && to ? `${from} - ${to}` : from || to || '-';
              }).join('; ') || '-';

              return [
                <td key={`${cat}_company-${student._id}`} className="px-4 py-2">{companies}</td>,
                <td key={`${cat}_timeline-${student._id}`} className="px-4 py-2">{timeline}</td>,
              ];
            })}

        {/* Action */}
        <td className="px-4 py-2">
          <button
            onClick={() => navigate(`/student/${student._id}`)}
            className="bg-blue-400 text-white px-2 py-1 rounded"
          >
            View
          </button>
        </td>
      </tr>
    );
  })}
</tbody>

          </table>
        )}
        {!loading && students.length === 0 && <p>No students found.</p>}
      </div>
    </div>
    </div>
  );
  
};

export default AdminDashboard;