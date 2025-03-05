import { useState, useRef } from "react";
import { FiDownload } from "react-icons/fi";
import axios from "axios";
import "./ResumeBuilder.css";
const ResumeBuilder = () => {
    const [activeTab, setActiveTab] = useState("Basic Details");
    const [formData, setFormData] = useState({
        basic_details: {
            primary_specialization: "", dob: "", gender: "", brief_bio: "",
        },

        certificates: {
            certificate_name: "", provider: "", valid_date: "", skills: "", description: "",
        },
        projects: {
            project_name: "", description: "", project_link: "", start_date: "", end_date: "", key_skills: "", team_size: 1
        },
        experience: {
            intership_or_job: "", company_name: "", job_type: "", industry_sector: "", designation: "", start_date: "", end_date: "",
            location_details: { city: "", state: "", pincode: "", country: "", },
            mentor_name: "", mentor_designation: "", key_responsibilities: "", currently_working_status: false,
        },
        skills: {
            hard_skills: [], soft_skills: [],
        },
        contact_details: {
            primary_contact_number: "", primary_email: "", email: "", other_contacts: [], weblinks: [], address: {
                address_line_1: "", address_line_2: "", city: "", state: "", pincode: "", country: "",
            }
        },
        academic_details: {   highest_qualification: {  degree: "",  university: "",  year_of_passing: "",  cgpa: "",  semester_details: [] },
            higher_secondary_details: {  school_name: "",  board: "",  medium: "",  year_of_passing: "",  aggregate_percentage: "",  location: { country: "",state: "",  city: "",  pincode: "" } },
            secondary_details: {  school_name: "",  board: "",  medium: "",  year_of_passing: "",  aggregate_percentage: "",  location: {  country: "",  state: "",  city: "",  pincode: "" }  }
  }

    });
   

    
    const [visitedTabs, setVisitedTabs] = useState(["Basic Details"]); // Track visited tabs
    const [activePreviewPanel, setActivePreviewPanel] = useState("Basic Details");
    const [activePreviewTab, setActivePreviewTab] = useState("Basic Details");
    const skillsRef = useRef(null);
    const expeienceRef = useRef(null);
    const projectsRef = useRef(null);
    const certificatesRef = useRef(null);
    const [validationResults, setValidationResults] = useState(null);
    const [aiUpdates, setAiUpdates] = useState(null);
    const [highlightedFields, setHighlightedFields] = useState({});
    const [tooltip, setTooltip] = useState(null);
    const tooltipRef = useRef(null);
    const tooltipTimeoutRef = useRef(null);
    const tabOrder = ["Basic Details","Contact Details","Academic Details","Certificates","Projects","Experience","Skills"]

    const showTooltip = (event, field, value) => {
        const rect = event.target.getBoundingClientRect();
        setTooltip({
            field, value,
            position: {
                left: rect.left + window.scrollX,
                top: rect.bottom + window.scrollY + 8,
                width: rect.width,
            },
        });
        if (tooltipTimeoutRef.current) {
            clearTimeout(tooltipTimeoutRef.current);
        }
    };
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let section;
    
        if (activeTab === "Certificates") {
            section = "certificates";
        } else if (activeTab === "Projects") {
            section = "projects";
        } else if (activeTab === "Experience") {
            section = "experience";
        } else if (activeTab === "Skills") {
            section = "skills";
        } else if (activeTab === "Contact Details") {
            section = "contact_details";
        } else if (activeTab === "Academic Details") {
            section = "academic_details";
        } else {
            section = "basic_details";
        }
    
        setFormData((prevState) => {
            let updatedData = { ...prevState };
    
            if (section === "experience" && name.startsWith("location_details.")) {
                // Handle experience → location_details (nested fields)
                const field = name.split(".")[1];
                updatedData.experience = {
                    ...prevState.experience,
                    location_details: {
                        ...prevState.experience.location_details,
                        [field]: value,
                    },
                };
            } else if (section === "contact_details") {
                if (["primary_contact_number", "primary_email", "email"].includes(name)) {
                    // Direct fields inside contact_details (not in address)
                    updatedData.contact_details = {
                        ...prevState.contact_details,
                        [name]: value,
                    };
                } else if (["address_line_1", "address_line_2", "city", "state", "pincode", "country"].includes(name)) {
                    // Fields inside contact_details.address
                    updatedData.contact_details = {
                        ...prevState.contact_details,
                        address: {
                            ...prevState.contact_details.address,
                            [name]: value,
                        },
                    };
                }
            } else if (section === "academic_details") {
                if (name.startsWith("highest_qualification.")) {
                    const field = name.split(".")[1];
                    updatedData.academic_details = {
                        ...prevState.academic_details,
                        highest_qualification: {
                            ...prevState.academic_details.highest_qualification,
                            [field]: value,
                        },
                    };
                } else if (name.startsWith("higher_secondary_details.")) {
                    const field = name.split(".")[1];
                    if (field.startsWith("location.")) {
                        // If updating higher_secondary_details.location
                        const locationField = field.split(".")[1];
                        updatedData.academic_details.higher_secondary_details = {
                            ...prevState.academic_details.higher_secondary_details,
                            location: {
                                ...prevState.academic_details.higher_secondary_details.location,
                                [locationField]: value,
                            },
                        };
                    } else {
                        // If updating higher_secondary_details fields
                        updatedData.academic_details.higher_secondary_details = {
                            ...prevState.academic_details.higher_secondary_details,
                            [field]: value,
                        };
                    }
                } else if (name.startsWith("secondary_details.")) {
                    const field = name.split(".")[1];
                    if (field.startsWith("location.")) {
                        // If updating secondary_details.location
                        const locationField = field.split(".")[1];
                        updatedData.academic_details.secondary_details = {
                            ...prevState.academic_details.secondary_details,
                            location: {
                                ...prevState.academic_details.secondary_details.location,
                                [locationField]: value,
                            },
                        };
                    } else {
                        // If updating secondary_details fields
                        updatedData.academic_details.secondary_details = {
                            ...prevState.academic_details.secondary_details,
                            [field]: value,
                        };
                    }
                }
            } else {
                // Handle all other sections normally
                updatedData[section] = {
                    ...prevState[section],
                    [name]: name === "team_size" ? parseInt(value, 10) || 0 : value,
                };
            }
    
            return updatedData;
        });
    };
  const goToNextTab = () => {
        const currentIndex = tabOrder.indexOf(activeTab);
        if (currentIndex < tabOrder.length - 1) {
            const nextTab = tabOrder[currentIndex + 1];
            setActiveTab(nextTab);
            setActivePreviewPanel(nextTab);
            setVisitedTabs((prev) => [...new Set([...prev, nextTab])]);
        }
    };

    const handleValidation = async () => {
        try {
            const isCertificateValidation = activeTab === "Certificates";
            const endpoint = isCertificateValidation ? "/validate-certificate" : "/validate";
            const rawData = isCertificateValidation ? formData.certificates : formData.basic_details;
            const data = isCertificateValidation
                ? rawData
                : {
                    specialization: rawData.primary_specialization,
                    dob: rawData.dob,
                    gender: rawData.gender,
                    bio: rawData.brief_bio
                };

            const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, data, {
                headers: { "Content-Type": "application/json" }
            });
            setValidationResults(response.data);
            const updatedAIData = { ...response.data.validated_data };
            if (!isCertificateValidation) {
                if (updatedAIData?.bio !== undefined) {
                    updatedAIData.brief_bio = updatedAIData.bio;
                    delete updatedAIData.bio;
                }
                if (updatedAIData?.specialization !== undefined) {
                    updatedAIData.primary_specialization = updatedAIData.specialization;
                    delete updatedAIData.specialization;
                }
            }
            setAiUpdates(updatedAIData);
            if (response.data.success) {
                let newHighlightedFields = {};
                if (!isCertificateValidation) {
                    Object.keys(data).forEach((field) => {
                        const correctedField = field === "bio" ? "brief_bio" :
                            field === "specialization" ? "primary_specialization" : field;
                        if (
                            updatedAIData[correctedField] !== undefined &&
                            String(data[field]) !== String(updatedAIData[correctedField])
                        ) {
                            newHighlightedFields[correctedField] = true;
                        }
                    });
                }
                setHighlightedFields(newHighlightedFields);
            }
        } catch (error) {
            console.error("Validation error:", error);
        }
    };
    const handleProjectValidation = async () => {
        try {
            const endpoint = "/validate-project";
            const rawData = formData.projects;
            const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, rawData, {
                headers: { "Content-Type": "application/json" }
            });
            const updatedAIData = response.data || {};
            setAiUpdates(updatedAIData);
            let newHighlightedFields = {};
            const project = typeof rawData === "object" ? rawData : {};
            if (response.data.fields_to_update && Array.isArray(response.data.fields_to_update)) {
                response.data.fields_to_update.forEach((field) => {
                    const oldValue = String(project[field] || "").trim();
                    const newValue = String(updatedAIData[field] || "").trim();
                    if (newValue !== "" && oldValue !== newValue) {
                        newHighlightedFields[`project_${field}`] = true;
                    } else {
                        console.log(`No Change Detected in: ${field}`);
                    }
                });
            } else {
                console.error("Error: `fields_to_update` is missing or not an array in API response.");
            }
            setHighlightedFields(newHighlightedFields);
        } catch (error) {
            console.error(" Validation error:", error);
        }
    };

    const handleExperienceValidation = async () => {
        try {
            console.log("Validating Experience Data:", formData.experience);
            console.log("Location Details before API call:", formData.experience.location_details);

            const endpoint = "/validate-experience";
            const rawData = formData.experience;

            // Ensure the format is correct before sending
            if (!rawData.location_details || typeof rawData.location_details !== "object") {
                console.error("Invalid location_details structure!", rawData.location_details);
                return;
            }

            const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, rawData, {
                headers: { "Content-Type": "application/json" }
            });

            console.log("Validation Response:", response.data);

            const updatedAIData = response.data || {};
            setAiUpdates(updatedAIData);

            let newHighlightedFields = {};
            const experience = typeof rawData === "object" ? rawData : {};

            if (response.data.fields_to_update && Array.isArray(response.data.fields_to_update)) {
                response.data.fields_to_update.forEach((field) => {
                    console.log(`Checking field: ${field}, Old Value: ${experience[field]}, New Value: ${updatedAIData[field]}`);

                    const oldValue = String(experience[field] || "").trim();
                    const newValue = String(updatedAIData[field] || "").trim();

                    if (newValue !== "" && oldValue !== newValue) {
                        newHighlightedFields[`experience_${field}`] = true;
                    }
                });
            } else {
                console.error("Error: `fields_to_update` is missing or not an array in API response.");
            }

            setHighlightedFields(newHighlightedFields);
        } catch (error) {
            console.error("Experience validation error:", error);
        }
    };

    const handleCertificateValidation = async () => {
        try {
            const endpoint = "/validate-certificate";
            const rawData = formData.certificates;
            const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, rawData, {
                headers: { "Content-Type": "application/json" }
            });
            const updatedAIData = response.data || {};
            setAiUpdates(updatedAIData);
            let newHighlightedFields = {};
            const certificate = typeof rawData === "object" ? rawData : {};
            if (response.data.fields_to_update && Array.isArray(response.data.fields_to_update)) {
                response.data.fields_to_update.forEach((field) => {
                    const oldValue = String(certificate[field] || "").trim();
                    const newValue = String(updatedAIData[field] || "").trim();
                    if (newValue !== "" && oldValue !== newValue) {
                        newHighlightedFields[`certificate_${field}`] = true;
                    } else {
                        console.log(`No Change Detected in: ${field}`);
                    }
                });
            } else {
                console.error("Error: `fields_to_update` is missing or not an array in API response.");
            }
            setHighlightedFields(newHighlightedFields);
        } catch (error) {
            console.error(" Validation error:", error);
        }
    };
    const handleSkillsValidation = async () => {
        try {
            const endpoint = "/validate-skills";
            let rawData = formData.skills;

            if (!rawData) {
                console.error("Skills data is undefined!");
                return;
            }

            let formattedData = {
                hard_skills: Array.isArray(rawData.hard_skills)
                    ? rawData.hard_skills
                    : rawData.hard_skills.split(",").map(skill => skill.trim()),

                soft_skills: Array.isArray(rawData.soft_skills)
                    ? rawData.soft_skills
                    : rawData.soft_skills.split(",").map(skill => skill.trim()),
            };

            console.log("🔹 Sending Skills Validation Request:", JSON.stringify(formattedData, null, 2));

            const response = await axios.post(`http://127.0.0.1:8000${endpoint}`, formattedData, {
                headers: { "Content-Type": "application/json" }
            });

            console.log(" Response Data:", response.data);

            // **Dynamically Highlight Fields That Need Updates**
            if (response.data.fields_to_update) {
                const updatedFields = {};
                response.data.fields_to_update.forEach((field) => {
                    updatedFields[field] = true;
                });
                setHighlightedFields(updatedFields);
            }

            setAiUpdates(response.data);
        } catch (error) {
            console.error(" Skills validation error:", error);
            if (error.response) {
                console.error(" Server Response:", error.response.data);
            }
        }
    };



    const handleAcceptChange = (field) => {
        if (!aiUpdates) return;

        let section;
        let fieldKey = field;

        if (activeTab === "Certificates") {
            section = "certificates";
            fieldKey = field.replace("certificate_", "");
        } else if (activeTab === "Projects") {
            section = "projects";
            fieldKey = field.replace("project_", "");
        } else if (activeTab === "Experience") {
            section = "experience";
            fieldKey = field.replace("experience_", "");
        } else if (activeTab === "Skills") {
            section = "skills";
            fieldKey = field.replace("skills_", "");
        } else {
            section = "basic_details";
        }

        let correctedValue = aiUpdates[fieldKey];

        // **Fix: Ensure correctedValue is a string**
        if (typeof correctedValue !== "string") {
            console.error(`Unexpected data type for ${fieldKey}:`, correctedValue);
            correctedValue = String(correctedValue || ""); // Convert to string
        }

        // **Fix 1: Remove suggestions in parentheses** (e.g., for company_name)
        correctedValue = correctedValue.includes("(") ? correctedValue.split("(")[0].trim() : correctedValue;

        // **Fix 2: Remove placeholders inside brackets** (e.g., in key_responsibilities)
        correctedValue = correctedValue.replace(/\[.*?\]/g, "").trim();

        setFormData((prevState) => ({
            ...prevState,
            [section]: {
                ...prevState[section],
                [fieldKey]: correctedValue
            },
        }));

        setHighlightedFields((prevState) => {
            const updatedFields = { ...prevState };
            delete updatedFields[field];
            return updatedFields;
        });

        setAiUpdates((prev) => {
            if (!prev) return null;
            const updated = { ...prev };
            delete updated[fieldKey];
            return updated;
        });

        setTooltip(null);
    };

    const handleRejectChange = (field) => {
        setHighlightedFields((prevState) => {
            const updatedFields = { ...prevState };
            delete updatedFields[field];
            return updatedFields;
        });

        setTooltip(null);
    };

    return (
        <div className="resume-builder">
            <div className="header">
                <div className="logo">ResumeAI</div>
                <div className="header-right">
                    <button className="btn-secondary">Templates</button>
                    <button className="btn-secondary">Pricing</button>
                    <button className="btn-primary">Sign In</button>
                    <button className="btn-primary">Get Started</button>
                </div>
            </div>
            <div className="main-content">
                <div className="left-panel">
                <div className="tabs-container">
    <div className="tabs">
        <button className={`tab ${activeTab === "Basic Details" ? "active" : ""}`}
            onClick={() => { setActiveTab("Basic Details"); setActivePreviewPanel("Basic Details"); }}>
            Basic Details
        </button>
        <button className={`tab ${activeTab === "Contact Details" ? "active" : ""}`}
            onClick={() => { setActiveTab("Contact Details"); setActivePreviewPanel("Contact Details"); }}>
            Contact Details
        </button>
        <button className={`tab ${activeTab === "Academic Details" ? "active" : ""}`}
            onClick={() => { setActiveTab("Academic Details"); setActivePreviewPanel("Academic Details"); }}>
            Academic Details
        </button>
        <button className={`tab ${activeTab === "Certificates" ? "active" : ""}`}
            onClick={() => { setActiveTab("Certificates"); setActivePreviewPanel("Certificates"); certificatesRef.current?.scrollIntoView({ behavior: "smooth" }); }}>
            Certificates
        </button>
        <button className={`tab ${activeTab === "Projects" ? "active" : ""}`}
            onClick={() => { setActiveTab("Projects"); setActivePreviewPanel("Projects"); }}>
            Projects
        </button>
        <button className={`tab ${activeTab === "Experience" ? "active" : ""}`}
            onClick={() => { setActiveTab("Experience"); setActivePreviewPanel("Experience"); }}>
            Experience
        </button>
        <button className={`tab ${activeTab === "Skills" ? "active" : ""}`}
            onClick={() => { setActiveTab("Skills"); setActivePreviewPanel("Skills"); }}>
            Skills
        </button>
    </div>
</div>



                    <div className="form-section">
                        {activeTab === "Basic Details" && (
                            <div>
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Basic Details</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Primary Specialization</label>
                                        <input type="text" name="primary_specialization" value={formData.basic_details.primary_specialization} onChange={handleInputChange} className={highlightedFields.primary_specialization ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date of Birth</label>
                                        <input type="text" name="dob" value={formData.basic_details.dob} onChange={handleInputChange} className={highlightedFields.dob ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Gender</label>
                                        <input
                                            type="text" name="gender" value={formData.basic_details.gender} onChange={handleInputChange} className={highlightedFields.gender ? "highlight" : ""}
                                        />
                                    </div>
                                </div>
                                <div className="form-group mt-2">
                                    <label>Description</label>
                                    <input
                                        type="text" name="brief_bio" value={formData.basic_details.brief_bio} onChange={handleInputChange} className={highlightedFields.brief_bio ? "highlight" : ""}
                                    />
                                </div>
                                <div className="button-container">
                                    <button className="btn-primary" onClick={handleValidation}>AI Suggestions</button>
                                    <button className="btn-primary" onClick={goToNextTab}>Next</button>
                                </div>

                            </div>
                        )}      
                        {activeTab === "Contact Details" && (
                            <div>
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Contact Details</h2>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Primary Contact Number</label>
                                        <input
                                            type="text" name="primary_contact_number" value={formData.contact_details.primary_contact_number} onChange={handleInputChange} className={highlightedFields.primary_contact_number ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Primary Email</label>
                                        <input
                                            type="text" name="primary_email" value={formData.contact_details.primary_email} onChange={handleInputChange} className={highlightedFields.primary_email ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Alternate Email</label>
                                        <input
                                            type="text" name="email" value={formData.contact_details.email} onChange={handleInputChange} className={highlightedFields.email ? "highlight" : ""}
                                        />
                                    </div>
                                </div>

                                <h3 className="mt-2">Address</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Address Line 1</label>
                                        <input
                                            type="text" name="address_line_1" value={formData.contact_details.address.address_line_1} onChange={handleInputChange} className={highlightedFields.address_line_1 ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Address Line 2</label>
                                        <input
                                            type="text" name="address_line_2" value={formData.contact_details.address.address_line_2} onChange={handleInputChange} className={highlightedFields.address_line_2 ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text" name="city" value={formData.contact_details.address.city} onChange={handleInputChange} className={highlightedFields.city ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input
                                            type="text" name="state" value={formData.contact_details.address.state} onChange={handleInputChange} className={highlightedFields.state ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input
                                            type="text" name="pincode" value={formData.contact_details.address.pincode} onChange={handleInputChange} className={highlightedFields.pincode ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input
                                            type="text" name="country" value={formData.contact_details.address.country} onChange={handleInputChange} className={highlightedFields.country ? "highlight" : ""}
                                        />
                                    </div>
                                </div>

                              
                                    <button className="btn-primary" onClick={goToNextTab}>Next</button>
                                
                            </div>
                        )}


                        {activeTab === "Certificates" && (
                            <div ref={certificatesRef} className="form-section">
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Certificates</h2>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>Certificate Name</label>
                                        <input type="text" name="certificate_name" value={formData.certificates.certificate_name} onChange={handleInputChange} className={highlightedFields.certificate_name ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Issuing Organization</label>
                                        <input type="text" name="provider" onChange={handleInputChange} className={highlightedFields.provider ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Valid Till</label>
                                        <input type="date" name="valid_date" onChange={handleInputChange} className={highlightedFields.valid_date ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Key Skills</label>
                                        <input type="text" name="skills" onChange={handleInputChange} className={highlightedFields.skills ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <input type="text" name="description" onChange={handleInputChange} className={highlightedFields.description ? "highlight" : ""} />
                                    </div>
                                    <div className="button-container">
                                        <button className="btn-primary" onClick={handleCertificateValidation}>AI Suggestions</button>
                                        <button className="btn-primary" onClick={goToNextTab}>Next</button>
                                    </div>

                                </div>
                            </div>
                        )}
                        {activeTab === "Projects" && (
                            <div ref={projectsRef} className="form-section">
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Projects</h2>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>Project Name</label>
                                        <input type="text" name="project_name" value={formData.projects.project_name} onChange={handleInputChange} className={highlightedFields.project_name ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" name="start_date" onChange={handleInputChange} className={highlightedFields.start_date ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" name="end_date" onChange={handleInputChange} value={formData.projects.end_date} className={highlightedFields.end_date ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Key Skills</label>
                                        <input type="text" name="key_skills" onChange={handleInputChange} value={formData.projects.key_skills} className={highlightedFields.key_skills ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Project Link</label>
                                        <input type="text" name="project_link" onChange={handleInputChange} className={highlightedFields.project_link ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <input type="text" name="description" onChange={handleInputChange} className={highlightedFields.description ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Team Size</label>
                                        <input type="number" name="team_size" onChange={handleInputChange} className={highlightedFields.team_size ? "highlight" : ""} />
                                    </div><div className="button-container">
                                        <button className="btn-primary mt-2" onClick={handleProjectValidation}>AI Suggestions</button>
                                        <button className="btn-primary" onClick={goToNextTab}>Next</button></div>
                                </div>
                            </div>
                        )}
                        {activeTab === "Experience" && (
                            <div ref={expeienceRef} className="form-section">
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Experience</h2>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>Designation</label>
                                        <input type="text" name="designation" value={formData.experience.designation} onChange={handleInputChange} className={highlightedFields[`experience_designation`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Company Name</label>
                                        <input type="text" name="company_name" value={formData.experience.company_name} onChange={handleInputChange} className={highlightedFields[`experience_company_name`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Job/Internship</label>
                                        <input type="text" name="intership_or_job" value={formData.experience.intership_or_job} onChange={handleInputChange} className={highlightedFields[`experience_intership_or_job`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Job Type</label>
                                        <input type="text" name="job_type" onChange={handleInputChange} className={highlightedFields[`experience_job_type`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Start Date</label>
                                        <input type="date" name="start_date" onChange={handleInputChange} className={highlightedFields[`experience_start_date`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>End Date</label>
                                        <input type="date" name="end_date" onChange={handleInputChange} className={highlightedFields[`experience_end_date`] ? "highlight" : ""}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Industry Sector</label>
                                        <input type="text" name="industry_sector" onChange={handleInputChange} className={highlightedFields['experience_industry_sector'] ? "highlight" : ""} />
                                    </div>
                                    <h3 style={{ fontWeight: "bold", fontSize: "1rem", marginTop: "1rem" }}>Location Details</h3>
                                    <div className="form-group">
                                        <label>City</label>
                                        <input
                                            type="text"
                                            name="location_details.city"
                                            value={formData.experience.location_details.city || ""}
                                            onChange={handleInputChange}
                                            className={highlightedFields[`experience_location_details.city`] ? "highlight" : ""}

                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>State</label>
                                        <input
                                            type="text" name="location_details.state" onChange={handleInputChange} value={formData.experience.location_details.state || ""} className={highlightedFields[`experience_location_details.state`] ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Pincode</label>
                                        <input
                                            type="text" name="location_details.pincode" onChange={handleInputChange} value={formData.experience.location_details.pincode || ""} className={highlightedFields[`experience_location_details.pincode`] ? "highlight" : ""}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Country</label>
                                        <input
                                            type="text" name="location_details.country" onChange={handleInputChange} value={formData.experience.location_details.country || ""} className={highlightedFields[`experience_location_details.country`] ? "highlight" : ""}
                                        />
                                    </div>


                                    <div className="form-group">
                                        <label>Mentor Name</label>
                                        <input type="text" name="mentor_name" onChange={handleInputChange} className={highlightedFields.mentor_name ? "highlight" : ""} />
                                    </div>
                                    <div className="form-group">
                                        <label>Mentor Designation</label>
                                        <input type="text" name="mentor_designation" value={formData.experience.mentor_designation || ""} onChange={handleInputChange} className={highlightedFields[`experience_mentor_designation`] ? "highlight" : ""} />

                                    </div>
                                    <div className="form-group">
                                        <label>Responsiblities</label>
                                        <input type="text" name="key_responsibilities" onChange={handleInputChange} className={highlightedFields[`experience_key_responsibilities`] ? "highlight" : ""}
                                        />
                                    </div><div className="button-container">
                                        <button className="btn-primary mt-2" onClick={handleExperienceValidation}>AI Suggestions</button>
                                        <button className="btn-primary" onClick={goToNextTab}>Next</button></div>
                                </div>
                            </div>

                        )}
                        {activeTab === "Skills" && (
                            <div ref={skillsRef} className="form-section">
                                <h2 style={{ fontWeight: "bold", fontSize: "1rem" }}>Skills</h2>
                                <div className="form-group">
                                    <div className="form-group">
                                        <label>Hard Skills</label>
                                        <input type="text" name="hard_skills" value={formData.skills.hard_skills} onChange={handleInputChange} className={highlightedFields.hard_skills ? "highlight" : ""} />      </div>
                                    <div className="form-group">
                                        <label>Soft Skills</label>
                                        <input type="text" name="soft_skills" value={formData.skills.soft_skills} onChange={handleInputChange} className={highlightedFields.soft_skills ? "highlight" : ""} />
                                    </div>
                                    <div className="button-container">
                                        <button className="btn-primary mt-2" onClick={handleSkillsValidation}>AI Suggestions</button>
                                        <button className="btn-primary" onClick={goToNextTab}>Next</button></div>
                                </div>

                            </div>

                        )}
                    </div>
                </div>
                <div className="preview-panel">
                    <div className="preview-header">
                        <div className="template-selector">
                            {["Modern", "Professional", "Creative", "Simple"].map((template) => (
                                <button key={template} className="template-btn">{template}</button>
                            ))}
                        </div>
                    </div>

                    <div className="score-indicator">
                        <div className="score">75</div>
                        <div className="score-label">ATS Score</div>
                    </div>

                    <div className="resume-content">
                        {visitedTabs.includes("Basic Details") && (
                            <>
                                <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "20px" }}>John Doe</h1>
                                <h2
                                    className={highlightedFields.primary_specialization ? "highlight" : ""}
                                    onMouseEnter={(e) => {
                                        if (highlightedFields.primary_specialization) {
                                            showTooltip(e, "primary_specialization", aiUpdates?.primary_specialization || "(No AI suggestion available)");
                                        }
                                    }}
                                    style={{ marginTop: "20px", marginBottom: "10px", fontWeight: "bold" }}
                                >
                                    {formData.basic_details.primary_specialization}
                                </h2>

                                <p
                                    className={highlightedFields.dob || highlightedFields.gender ? "highlight" : ""}
                                    onMouseEnter={(e) => (highlightedFields.dob || highlightedFields.gender) && showTooltip(e, "dob_gender", `${aiUpdates?.dob || formData.basic_details.dob} | ${aiUpdates?.gender || formData.basic_details.gender}`)}
                                >
                                    {formData.basic_details.dob} | {formData.basic_details.gender}
                                </p>

                                <p
                                    className={highlightedFields.brief_bio ? "highlight" : ""}
                                    onMouseEnter={(e) => {
                                        if (highlightedFields.brief_bio) {
                                            showTooltip(e, "brief_bio", aiUpdates?.brief_bio || "(No AI suggestion available)");
                                        }
                                    }}
                                >
                                    {formData.basic_details.brief_bio}
                                </p>
                            </>
                        )}
                        {visitedTabs.includes("Contact Details") && (
    <>
        <h2 style={{ fontWeight: "bold", fontSize: "1rem", marginTop: "20px" }}>
            Contact Details
        </h2>

        <p>Primary Contact Number: {formData.contact_details.primary_contact_number}</p>
        <p>Primary Email: {formData.contact_details.primary_email}</p>
        <p>Alternate Email: {formData.contact_details.email}</p>

        <h3 style={{ marginTop: "20px" }}>Address</h3>

        <p>Address Line 1: {formData.contact_details.address.address_line_1}</p>
        <p>Address Line 2: {formData.contact_details.address.address_line_2}</p>
        <p>City: {formData.contact_details.address.city}</p>
        <p>State: {formData.contact_details.address.state}</p>
        <p>Pincode: {formData.contact_details.address.pincode}</p>
        <p>Country: {formData.contact_details.address.country}</p>
    </>
)}


                        {visitedTabs.includes("Certificates") && (
                            <>
                                <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "20px" }}>Certifications</h2>
                                <div className="project-container">
                                    <div className="project-header">
                                        <p
                                            className={highlightedFields.certificate_name ? "highlight" : ""}
                                            onMouseEnter={(e) => {
                                                if (highlightedFields.certificate_name) {
                                                    showTooltip(e, "certificate_name", aiUpdates?.certificate_name || "(No AI suggestion available)");
                                                }
                                            }}
                                        >
                                            {formData.certificates.certificate_name}
                                        </p>

                                        <p

                                            className={highlightedFields.valid_date ? "highlight" : ""}
                                            onMouseEnter={(e) => {
                                                if (highlightedFields.valid_date) {
                                                    showTooltip(e, "valid_date", aiUpdates?.valid_date || "(No AI suggestion available)");
                                                }
                                            }}
                                        >
                                            {formData.certificates.valid_date}
                                        </p>
                                    </div>
                                    <p
                                        className={highlightedFields.provider ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields.provider) {
                                                showTooltip(e, "provider", aiUpdates?.provider || "(No AI suggestion available)");
                                            }
                                        }}
                                    >
                                        {formData.certificates.provider}
                                    </p>

                                    <p
                                        className={highlightedFields.skills ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields.skills) {
                                                showTooltip(e, "skills", aiUpdates?.skills || "(No AI suggestion available)");
                                            }
                                        }}
                                    >
                                        {formData.certificates.skills}
                                    </p>

                                    <p
                                        className={highlightedFields.description ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields.description) {
                                                showTooltip(e, "description", aiUpdates?.description || "(No AI suggestion available)");
                                            }
                                        }}
                                    >
                                        {formData.certificates.description}
                                    </p></div>
                            </>
                        )}

                        {visitedTabs.includes("Projects") && (
                            <>
                                <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "20px" }}>Projects</h2>

                                <div className="project-container">
                                    <div className="project-header">
                                        <p
                                            className="project-name"

                                            onMouseEnter={(e) => {
                                                if (highlightedFields.project_name) {
                                                    showTooltip(e, "project_name", aiUpdates?.project_name || "(No AI suggestion available)");
                                                }
                                            }}
                                        >
                                            {formData.projects.project_name}
                                        </p>
                                        <p
                                            className="project-date"
                                            onMouseEnter={(e) => {
                                                if (highlightedFields.start_date && aiUpdates?.start_date) {
                                                    showTooltip(e, "start_date", aiUpdates.start_date);
                                                }
                                            }}
                                        >
                                            {formData.projects.start_date ? ` ${formData.projects.start_date}|${formData.projects.end_date}` : ""}
                                        </p>
                                    </div>


                                    {Object.keys(formData.projects).map((field) =>
                                        !["end_date", "start_date", "project_name", "team_size"].includes(field) ? (
                                            <p
                                                key={field}
                                                className={highlightedFields[`project_${field}`] ? "highlight" : ""}
                                                onMouseEnter={(e) => {
                                                    const fieldKey = `project_${field}`;
                                                    const suggestedValue = aiUpdates?.[field];

                                                    if (highlightedFields[fieldKey] && suggestedValue) {
                                                        showTooltip(e, fieldKey, suggestedValue);
                                                    }
                                                }}
                                            >
                                                {formData.projects[field]}
                                            </p>
                                        ) : null
                                    )}

                                </div>
                            </>
                        )}
                        {visitedTabs.includes("Experience") && (
                            <>
                                <div className="experience-container">
                                    <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "20px" }}>Experience</h2>
                                    {/* Industry Sector & Date */}
                                    <div className="experience-header">

                                        <p
                                            className={`experience-industry ${highlightedFields['experience_industry_sector'] ? "highlight" : ""}`}
                                            onMouseEnter={(e) => {
                                                if (highlightedFields['experience_industry_sector'] && aiUpdates?.industry_sector) {
                                                    showTooltip(e, "experience_industry_sector", aiUpdates.industry_sector);
                                                }
                                            }}
                                        >
                                            {formData.experience.industry_sector || ""}
                                        </p>

                                        <p
                                            className={`experience-date ${highlightedFields['experience_start_date'] ? "highlight" : ""}`}
                                            onMouseEnter={(e) => {
                                                if (highlightedFields['experience_start_date'] && aiUpdates?.start_date) {
                                                    showTooltip(e, "experience_start_date", aiUpdates.start_date);
                                                }
                                            }}
                                        >
                                            {formData.experience.start_date
                                                ? `${formData.experience.start_date} | ${formData.experience.end_date || "Present"}`
                                                : ""}
                                        </p>
                                    </div>

                                    {/* Designation, Company Name, Job Type */}
                                    <p
                                        className={highlightedFields['experience_designation'] ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields['experience_designation'] && aiUpdates?.designation) {
                                                showTooltip(e, "experience_designation", aiUpdates.designation);
                                            }
                                        }}
                                    >
                                        <strong>{formData.experience.designation || ""}</strong> | {formData.experience.company_name || ""}
                                    </p>

                                    {/* Job/Internship & Type */}
                                    <p
                                        className={highlightedFields['experience_intership_or_job'] ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields['experience_intership_or_job'] && aiUpdates?.intership_or_job) {
                                                showTooltip(e, "experience_intership_or_job", aiUpdates.intership_or_job);
                                            }
                                        }}
                                    >
                                        {formData.experience.intership_or_job || ""} | {formData.experience.job_type || ""}
                                    </p>

                                    {/* Location Details */}
                                    {formData.experience.location_details && typeof formData.experience.location_details === "object" && (
                                        <p
                                            className={highlightedFields['experience_location_details.city'] ? "highlight" : ""}
                                            onMouseEnter={(e) => {
                                                if (highlightedFields['experience_location_details.city'] && aiUpdates?.city) {
                                                    showTooltip(e, "experience_location_details.city", aiUpdates.city);
                                                }
                                            }}
                                        >
                                            <strong>Location</strong> <br />
                                            {formData.experience.location_details.city || "City"},
                                            {formData.experience.location_details.pincode || "Pincode"},
                                            {formData.experience.location_details.state || "State"},
                                            {formData.experience.location_details.country || "Country"}
                                        </p>
                                    )}

                                    {/* Mentor Details */}
                                    <p
                                        className={highlightedFields['experience_mentor_designation'] ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields['experience_mentor_designation'] && aiUpdates?.mentor_designation) {
                                                showTooltip(e, "experience_mentor_designation", aiUpdates.mentor_designation);
                                            }
                                        }}
                                    >
                                        <strong>Mentor Designation:</strong> {formData.experience.mentor_designation}
                                    </p>

                                    <p
                                        className={highlightedFields['experience_mentor_name'] ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields['experience_mentor_name'] && aiUpdates?.mentor_name) {
                                                showTooltip(e, "experience_mentor_name", aiUpdates.mentor_name);
                                            }
                                        }}
                                    >
                                        <strong>Mentor Name:</strong> {formData.experience.mentor_name}
                                    </p>

                                    {/* Responsibilities */}
                                    <p
                                        className={highlightedFields['experience_key_responsibilities'] ? "highlight" : ""}
                                        onMouseEnter={(e) => {
                                            if (highlightedFields['experience_key_responsibilities'] && aiUpdates?.key_responsibilities) {
                                                showTooltip(e, "experience_key_responsibilities", aiUpdates.key_responsibilities);
                                            }
                                        }}
                                    >
                                        <strong>Responsibilities:</strong> {formData.experience.key_responsibilities}
                                    </p>
                                </div>
                            </>
                        )}
                        {visitedTabs.includes("Experience") && (
                            <>

                                <div className="project-header">
                                    <h2 style={{ fontSize: "1.3rem", fontWeight: "bold", marginTop: "20px" }}>
                                        Skills
                                    </h2>
                                </div>
                                <p
                                    className={highlightedFields.hard_skills ? "highlight" : ""}
                                    onMouseEnter={(e) => {
                                        if (highlightedFields.hard_skills) {
                                            showTooltip(e, "hard_skills", aiUpdates?.hard_skills || "(No AI suggestion available)");
                                        }
                                    }}
                                >
                                    <strong>Hard Skills:</strong> {formData.skills.hard_skills}
                                </p>

                                <p
                                    className={highlightedFields.soft_skills ? "highlight" : ""}
                                    onMouseEnter={(e) => {
                                        if (highlightedFields.soft_skills) {
                                            showTooltip(e, "soft_skills", aiUpdates?.soft_skills || "(No AI suggestion available)");
                                        }
                                    }}
                                >
                                    <strong>Soft Skills:</strong> {formData.skills.soft_skills}
                                </p>

                            </>
                        )}

                        {/* Tooltip Display (Ensuring it doesn't duplicate) */}
                        {tooltip && tooltip.position && (
                            <div ref={tooltipRef} className="tooltip-card" style={{ left: tooltip.position.left, top: tooltip.position.top }}>
                                <p><strong>Suggested Update:</strong> {tooltip.value}</p>
                                <button onClick={() => handleAcceptChange(tooltip.field)}>Yes</button>
                                <button onClick={() => handleRejectChange(tooltip.field)}>No</button>
                            </div>
                        )}


                    </div>
                </div>
            </div>
        </div >
    );
};

export default ResumeBuilder;
