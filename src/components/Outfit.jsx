import React from "react";

export default function Outfit({ outfits }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {outfits.map((outfit, index) => (
        <div
          className="max-w-full rounded overflow-hidden shadow-lg bg-white transform hover:scale-105 transition-transform duration-300"
          key={index}
          style={{
            border: "1px solid #eee",
            padding: "15px",
            marginBottom: "20px",
          }}
        >
          <div className="mb-4"></div>
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            {outfit["Cloth Name"]}
          </h3>
          <p className="text-sm text-gray-600">
            <strong>Category:</strong> {outfit.Category}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Why is it beneficial:</strong>{" "}
            {outfit["Why is it beneficial"]}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Price:</strong> {outfit.Price}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Popularity:</strong> {outfit.Popularity}
          </p>
        </div>
      ))}
    </div>
  );
}
