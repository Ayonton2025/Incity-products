import React from "react";

export default function HealthCard({ HealthPrecautions, MedicineList }) {
  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Health Precautions Card */}
        <div className="card border rounded-lg shadow-lg p-4 bg-white">
          {HealthPrecautions.length > 0 ? (
            <ul className="list-disc pl-5">
              {HealthPrecautions.map((precaution, index) => (
                <li key={index} className="mb-3">
                  <p className="font-semibold">{precaution.Precaution}</p>
                  <p className="text-gray-600">
                    {precaution["Why is it important"]}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No health precautions available.</p>
          )}
        </div>

        {/* Medicine List Card */}
        <div className="card border rounded-lg shadow-lg p-4 bg-white">
          <h2 className="text-xl font-bold mb-4">Essential Medicines</h2>
          {MedicineList.length > 0 ? (
            <ul className="list-disc pl-5">
              {MedicineList.map((medicine, index) => (
                <li key={index} className="mb-3">
                  <p className="font-semibold">{medicine["Medicine Name"]}</p>
                  <p className="text-gray-600">
                    <strong>Purpose:</strong> {medicine.Purpose}
                  </p>
                  <p className="text-gray-600">
                    <strong>Dosage:</strong> {medicine.Dosage}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p>No medicines listed.</p>
          )}
        </div>
      </div>
    </div>
  );
}
