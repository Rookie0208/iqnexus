import React from 'react';
import Select from 'react-select';
import { BASE_URL } from '../Api';

const KG_SUBJECTS = [
    { value: 'IQKD', label: 'IQKD - Kindergarten Book' },
];

const REGULAR_SUBJECTS = [
    { value: 'IAOL1', label: 'IQROL1 - Reasoning L1' },
    { value: 'ITSTL1', label: 'IQSOL1 - Science L1' },
    { value: 'IMOL1', label: 'IQMOL1 - Maths L1' },
    { value: 'IGKOL1', label: 'IQGKOL1 - GK L1' },
    { value: 'IENGOL1', label: 'IQEOL1 - English L1' },
    { value: 'IAOL2', label: 'IQROL2 - Reasoning L2' },
    { value: 'ITSTL2', label: 'IQSOL2 - Science L2' },
    { value: 'IMOL2', label: 'IQMOL2 - Maths L2' },
    { value: 'IENGOL2', label: 'IQEOL2 - English L2' },
];

const StudyMaterial = () => {
    const [formData, setFormData] = React.useState({
        name: '',
        classes: [],
        kgSection: '',
        subject: '',
        fee: '',
        pdf: null,
    });

    const classOptions = [
        { value: 'kindergarten', label: 'Kindergarten' },
        ...[...Array(12)].map((_, i) => ({
            value: (i + 1).toString(),
            label: `Class ${i + 1}`,
        })),
    ];

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'pdf') {
            setFormData({ ...formData, pdf: files[0] });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleClassChange = (selectedOptions) => {
        const classes = selectedOptions ? selectedOptions.map(opt => opt.value) : [];
        setFormData(prev => ({
            ...prev,
            classes,
            kgSection: classes.includes('kindergarten') ? prev.kgSection : '',
            subject: '',
        }));
    };

    const hasKindergarten = formData.classes.includes('kindergarten');
    const hasRegularClasses = formData.classes.some((c) => c !== 'kindergarten');
    const subjectOptions = hasKindergarten && !hasRegularClasses ? KG_SUBJECTS : REGULAR_SUBJECTS;

    const [materialType, setMaterialType] = React.useState('file');
    const [link, setLink] = React.useState('');

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-6 text-center">Study Material</h1>
            <form
                onSubmit={async (e) => {
                    e.preventDefault();
                    if (formData.classes.length === 0) {
                        alert('Please select at least one class.');
                        return;
                    }

                    if (hasKindergarten && hasRegularClasses) {
                        alert('Upload kindergarten materials separately from Class 1–12 materials.');
                        return;
                    }

                    if (hasKindergarten && !formData.kgSection) {
                        alert('Please select a kindergarten section (PG, LKG, or UKG).');
                        return;
                    }

                    if (materialType === 'file' && !formData.pdf) {
                        alert('Please select a PDF file to upload.');
                        return;
                    }

                    if (materialType === 'link' && !link.trim()) {
                        alert('Please enter a material link URL.');
                        return;
                    }

                    let successCount = 0;
                    let failCount = 0;
                    let lastError = '';

                    for (const cls of formData.classes) {
                        const data = new FormData();
                        data.append('name', formData.name);
                        data.append('class', cls);
                        data.append('subject', formData.subject);
                        data.append('fee', formData.fee);
                        data.append('materialType', materialType);
                        if (cls === 'kindergarten' && formData.kgSection) {
                            data.append('kgSection', formData.kgSection);
                        }
                        if (materialType === 'file' && formData.pdf) {
                            data.append('file', formData.pdf);
                        }
                        if (materialType === 'link' && link) {
                            data.append('link', link);
                        }
                        try {
                            const response = await fetch(`${BASE_URL}/addStudentStudyMaterial`, {
                                method: 'POST',
                                body: data,
                            });
                            const result = await response.json();

                            if (!response.ok || result.error) {
                                throw new Error(result.details || result.error || 'Upload failed');
                            }
                            successCount++;
                        } catch (error) {
                            console.error(`Upload error for class ${cls}:`, error);
                            lastError = error.message;
                            failCount++;
                        }
                    }

                    if (failCount === 0) {
                        alert(`Study material uploaded successfully for ${successCount} class(es)!`);
                    } else {
                        alert(
                            `Uploaded for ${successCount} class(es). Failed for ${failCount} class(es).` +
                            (lastError ? `\n\nLast error: ${lastError}` : '')
                        );
                    }

                    setFormData({
                        name: '',
                        classes: [],
                        kgSection: '',
                        subject: '',
                        fee: '',
                        pdf: null,
                    });
                    setLink('');
                    setMaterialType('file');
                }}
                className="space-y-5"
            >
                <div>
                    <label htmlFor="name" className="block mb-1 font-medium">Title:</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Sample paper, Syllabus"
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="class" className="block mb-1 font-medium">Class (select multiple):</label>
                    <Select
                        isMulti
                        options={classOptions}
                        value={classOptions.filter(opt => formData.classes.includes(opt.value))}
                        onChange={handleClassChange}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Select class(es)..."
                        styles={{
                            control: (base) => ({
                                ...base,
                                borderColor: '#d1d5db',
                                '&:hover': { borderColor: '#3b82f6' },
                            }),
                            menu: (base) => ({
                                ...base,
                                zIndex: 50,
                            }),
                        }}
                    />
                </div>
                {hasKindergarten && (
                    <div>
                        <label htmlFor="kgSection" className="block mb-1 font-medium">Kindergarten Section:</label>
                        <select
                            id="kgSection"
                            name="kgSection"
                            value={formData.kgSection}
                            onChange={handleChange}
                            required
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Section</option>
                            <option value="PG">Pre-Primary (PG)</option>
                            <option value="LKG">Lower Kindergarten (LKG)</option>
                            <option value="UKG">Upper Kindergarten (UKG)</option>
                        </select>
                    </div>
                )}
                <div>
                    <label htmlFor="subject" className="block mb-1 font-medium">Exam / Subject:</label>
                    <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select exam</option>
                        {subjectOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="fee" className="block mb-1 font-medium">Fee (0 = free):</label>
                    <input
                        type="number"
                        id="fee"
                        name="fee"
                        min="0"
                        value={formData.fee}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label htmlFor="materialType" className="block mb-1 font-medium">Material Type</label>
                    <select
                        id="materialType"
                        name="materialType"
                        value={materialType}
                        onChange={e => setMaterialType(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="file">PDF File</option>
                        <option value="link">External Link</option>
                    </select>
                </div>
                {materialType === 'file' ? (
                    <div>
                        <label htmlFor="pdf" className="block mb-1 font-medium">Upload PDF</label>
                        <input
                            type="file"
                            id="pdf"
                            name="pdf"
                            accept="application/pdf"
                            onChange={handleChange}
                            required={materialType === 'file'}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                ) : (
                    <div>
                        <label htmlFor="link" className="block mb-1 font-medium">Material URL</label>
                        <input
                            type="url"
                            id="link"
                            name="link"
                            value={link}
                            onChange={e => setLink(e.target.value)}
                            required={materialType === 'link'}
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                >
                    Save
                </button>
            </form>
        </div>
    );
};

export default StudyMaterial;
