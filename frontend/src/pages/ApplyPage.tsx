import { FormEvent, useState } from "react";

interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
}

interface Lifestyle {
  smoker: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  occupation: string;
  hazardousActivities: string;
}

interface MedicalHistory {
  height: string;
  weight: string;
  existingConditions: string[];
  medications: string;
  familyHistory: string;
  recentHospitalisation: string;
}

interface ApplicationData {
  personal: PersonalDetails;
  lifestyle: Lifestyle;
  medical: MedicalHistory;
}

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>({
    personal: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      postcode: "",
    },
    lifestyle: {
      smoker: "",
      alcoholConsumption: "",
      exerciseFrequency: "",
      occupation: "",
      hazardousActivities: "",
    },
    medical: {
      height: "",
      weight: "",
      existingConditions: [],
      medications: "",
      familyHistory: "",
      recentHospitalisation: "",
    },
  });

  const updatePersonal = (field: keyof PersonalDetails, value: string) => {
    setFormData({
      ...formData,
      personal: { ...formData.personal, [field]: value },
    });
  };

  const updateLifestyle = (field: keyof Lifestyle, value: string) => {
    setFormData({
      ...formData,
      lifestyle: { ...formData.lifestyle, [field]: value },
    });
  };

  const updateMedical = (field: keyof MedicalHistory, value: string | string[]) => {
    setFormData({
      ...formData,
      medical: { ...formData.medical, [field]: value },
    });
  };

  const toggleCondition = (condition: string) => {
    const conditions = formData.medical.existingConditions;
    if (conditions.includes(condition)) {
      updateMedical(
        "existingConditions",
        conditions.filter((c) => c !== condition)
      );
    } else {
      updateMedical("existingConditions", [...conditions, condition]);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    try {
      // Import the API client
      const { submitApplication } = await import("../api/client");
      
      // Submit to backend - no console.log (GDPR: no health data in logs)
      const result = await submitApplication(formData);
      
      // Show success message with application reference
      alert(
        `Application submitted successfully!\n\n` +
        `Your reference: ${result.reference}\n\n` +
        `Please save this reference for your records.`
      );
      
      // TODO (M2): Redirect to status page or show confirmation screen
      
    } catch (error) {
      // Show error to user
      const message = error instanceof Error ? error.message : "An error occurred";
      alert(`Failed to submit application: ${message}`);
    }
  };

  const calculateBMI = () => {
    const height = parseFloat(formData.medical.height);
    const weight = parseFloat(formData.medical.weight);
    if (height > 0 && weight > 0) {
      const bmi = weight / ((height / 100) ** 2);
      return bmi.toFixed(1);
    }
    return "—";
  };

  return (
    <main className="page">
      <h1>Apply for cover</h1>

      {/* Progress indicator */}
      <div className="progress-steps">
        <div className={`progress-step ${currentStep >= 1 ? "active" : ""}`}>
          1. Personal
        </div>
        <div className={`progress-step ${currentStep >= 2 ? "active" : ""}`}>
          2. Lifestyle
        </div>
        <div className={`progress-step ${currentStep >= 3 ? "active" : ""}`}>
          3. Medical
        </div>
        <div className={`progress-step ${currentStep >= 4 ? "active" : ""}`}>
          4. Review
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stack">
        {/* Step 1: Personal Details */}
        {currentStep === 1 && (
          <div className="card">
            <h2>Personal Details</h2>

            <label>
              First Name *
              <input
                type="text"
                value={formData.personal.firstName}
                onChange={(e) => updatePersonal("firstName", e.target.value)}
                required
              />
            </label>

            <label>
              Last Name *
              <input
                type="text"
                value={formData.personal.lastName}
                onChange={(e) => updatePersonal("lastName", e.target.value)}
                required
              />
            </label>

            <label>
              Date of Birth *
              <input
                type="date"
                value={formData.personal.dateOfBirth}
                onChange={(e) => updatePersonal("dateOfBirth", e.target.value)}
                required
              />
            </label>

            <label>
              Email Address *
              <input
                type="email"
                value={formData.personal.email}
                onChange={(e) => updatePersonal("email", e.target.value)}
                required
              />
            </label>

            <label>
              Phone Number *
              <input
                type="tel"
                value={formData.personal.phone}
                onChange={(e) => updatePersonal("phone", e.target.value)}
                required
              />
            </label>

            <label>
              Address Line 1 *
              <input
                type="text"
                value={formData.personal.addressLine1}
                onChange={(e) => updatePersonal("addressLine1", e.target.value)}
                required
              />
            </label>

            <label>
              Address Line 2
              <input
                type="text"
                value={formData.personal.addressLine2}
                onChange={(e) => updatePersonal("addressLine2", e.target.value)}
              />
            </label>

            <label>
              City *
              <input
                type="text"
                value={formData.personal.city}
                onChange={(e) => updatePersonal("city", e.target.value)}
                required
              />
            </label>

            <label>
              Postcode *
              <input
                type="text"
                value={formData.personal.postcode}
                onChange={(e) => updatePersonal("postcode", e.target.value)}
                required
              />
            </label>
          </div>
        )}

        {/* Step 2: Lifestyle */}
        {currentStep === 2 && (
          <div className="card">
            <h2>Lifestyle</h2>

            <label>
              Do you smoke? *
              <select
                value={formData.lifestyle.smoker}
                onChange={(e) => updateLifestyle("smoker", e.target.value)}
                required
              >
                <option value="">Please select</option>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker (quit over 12 months ago)</option>
                <option value="current">Current smoker</option>
              </select>
            </label>

            <label>
              Alcohol consumption *
              <select
                value={formData.lifestyle.alcoholConsumption}
                onChange={(e) =>
                  updateLifestyle("alcoholConsumption", e.target.value)
                }
                required
              >
                <option value="">Please select</option>
                <option value="none">None</option>
                <option value="occasional">Occasional (1-2 units per week)</option>
                <option value="moderate">Moderate (3-14 units per week)</option>
                <option value="heavy">Heavy (15+ units per week)</option>
              </select>
            </label>

            <label>
              Exercise frequency *
              <select
                value={formData.lifestyle.exerciseFrequency}
                onChange={(e) =>
                  updateLifestyle("exerciseFrequency", e.target.value)
                }
                required
              >
                <option value="">Please select</option>
                <option value="none">None</option>
                <option value="occasional">Occasional (1-2 times per week)</option>
                <option value="regular">Regular (3-4 times per week)</option>
                <option value="frequent">Frequent (5+ times per week)</option>
              </select>
            </label>

            <label>
              Occupation *
              <input
                type="text"
                value={formData.lifestyle.occupation}
                onChange={(e) => updateLifestyle("occupation", e.target.value)}
                placeholder="e.g. Software Developer, Teacher, Nurse"
                required
              />
            </label>

            <label>
              Do you participate in hazardous activities? *
              <select
                value={formData.lifestyle.hazardousActivities}
                onChange={(e) =>
                  updateLifestyle("hazardousActivities", e.target.value)
                }
                required
              >
                <option value="">Please select</option>
                <option value="none">None</option>
                <option value="some">
                  Some (e.g. skiing, cycling, amateur sports)
                </option>
                <option value="high">
                  High risk (e.g. skydiving, rock climbing, motorsports)
                </option>
              </select>
            </label>
          </div>
        )}

        {/* Step 3: Medical History */}
        {currentStep === 3 && (
          <div className="card">
            <h2>Medical History</h2>

            <label>
              Height (cm) *
              <input
                type="number"
                value={formData.medical.height}
                onChange={(e) => updateMedical("height", e.target.value)}
                min="100"
                max="250"
                required
              />
            </label>

            <label>
              Weight (kg) *
              <input
                type="number"
                value={formData.medical.weight}
                onChange={(e) => updateMedical("weight", e.target.value)}
                min="30"
                max="300"
                required
              />
            </label>

            {formData.medical.height && formData.medical.weight && (
              <p className="notice">
                Your BMI: <strong>{calculateBMI()}</strong>
              </p>
            )}

            <label>
              Existing medical conditions (select all that apply)
              <div className="checkbox-group">
                {[
                  "None",
                  "Diabetes",
                  "High blood pressure",
                  "Heart disease",
                  "Asthma",
                  "Cancer (current or previous)",
                  "Mental health condition",
                  "Other chronic condition",
                ].map((condition) => (
                  <label key={condition} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.medical.existingConditions.includes(
                        condition
                      )}
                      onChange={() => toggleCondition(condition)}
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </label>

            <label>
              Current medications
              <textarea
                value={formData.medical.medications}
                onChange={(e) => updateMedical("medications", e.target.value)}
                placeholder="List any medications you currently take, or write 'None'"
                rows={3}
              />
            </label>

            <label>
              Family medical history *
              <select
                value={formData.medical.familyHistory}
                onChange={(e) => updateMedical("familyHistory", e.target.value)}
                required
              >
                <option value="">Please select</option>
                <option value="none">
                  No significant family history
                </option>
                <option value="some">
                  Some family history (e.g. diabetes, high blood pressure)
                </option>
                <option value="significant">
                  Significant family history (e.g. heart disease, cancer before age 60)
                </option>
              </select>
            </label>

            <label>
              Have you been hospitalised in the last 5 years? *
              <select
                value={formData.medical.recentHospitalisation}
                onChange={(e) =>
                  updateMedical("recentHospitalisation", e.target.value)
                }
                required
              >
                <option value="">Please select</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </label>
          </div>
        )}

        {/* Step 4: Review and Submit */}
        {currentStep === 4 && (
          <div className="card">
            <h2>Review Your Application</h2>

            <div className="review-section">
              <h3>
                Personal Details{" "}
                <button
                  type="button"
                  className="button-link"
                  onClick={() => setCurrentStep(1)}
                >
                  Edit
                </button>
              </h3>
              <table className="data">
                <tbody>
                  <tr>
                    <td>Name</td>
                    <td>
                      {formData.personal.firstName} {formData.personal.lastName}
                    </td>
                  </tr>
                  <tr>
                    <td>Date of Birth</td>
                    <td>{formData.personal.dateOfBirth}</td>
                  </tr>
                  <tr>
                    <td>Email</td>
                    <td>{formData.personal.email}</td>
                  </tr>
                  <tr>
                    <td>Phone</td>
                    <td>{formData.personal.phone}</td>
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>
                      {formData.personal.addressLine1}
                      {formData.personal.addressLine2 &&
                        `, ${formData.personal.addressLine2}`}
                      , {formData.personal.city}, {formData.personal.postcode}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="review-section">
              <h3>
                Lifestyle{" "}
                <button
                  type="button"
                  className="button-link"
                  onClick={() => setCurrentStep(2)}
                >
                  Edit
                </button>
              </h3>
              <table className="data">
                <tbody>
                  <tr>
                    <td>Smoker</td>
                    <td>{formData.lifestyle.smoker}</td>
                  </tr>
                  <tr>
                    <td>Alcohol</td>
                    <td>{formData.lifestyle.alcoholConsumption}</td>
                  </tr>
                  <tr>
                    <td>Exercise</td>
                    <td>{formData.lifestyle.exerciseFrequency}</td>
                  </tr>
                  <tr>
                    <td>Occupation</td>
                    <td>{formData.lifestyle.occupation}</td>
                  </tr>
                  <tr>
                    <td>Hazardous Activities</td>
                    <td>{formData.lifestyle.hazardousActivities}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="review-section">
              <h3>
                Medical History{" "}
                <button
                  type="button"
                  className="button-link"
                  onClick={() => setCurrentStep(3)}
                >
                  Edit
                </button>
              </h3>
              <table className="data">
                <tbody>
                  <tr>
                    <td>Height</td>
                    <td>{formData.medical.height} cm</td>
                  </tr>
                  <tr>
                    <td>Weight</td>
                    <td>{formData.medical.weight} kg</td>
                  </tr>
                  <tr>
                    <td>BMI</td>
                    <td>{calculateBMI()}</td>
                  </tr>
                  <tr>
                    <td>Existing Conditions</td>
                    <td>
                      {formData.medical.existingConditions.length > 0
                        ? formData.medical.existingConditions.join(", ")
                        : "None"}
                    </td>
                  </tr>
                  <tr>
                    <td>Medications</td>
                    <td>{formData.medical.medications || "None"}</td>
                  </tr>
                  <tr>
                    <td>Family History</td>
                    <td>{formData.medical.familyHistory}</td>
                  </tr>
                  <tr>
                    <td>Recent Hospitalisation</td>
                    <td>{formData.medical.recentHospitalisation}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="notice">
              By submitting this application, you confirm that all information
              provided is accurate and complete to the best of your knowledge.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="form-navigation">
          {currentStep > 1 && (
            <button type="button" className="button" onClick={prevStep}>
              Previous
            </button>
          )}

          {currentStep < 4 && (
            <button type="button" className="button" onClick={nextStep}>
              Next
            </button>
          )}

          {currentStep === 4 && (
            <button type="submit" className="button">
              Submit Application
            </button>
          )}
        </div>
      </form>
    </main>
  );
}
