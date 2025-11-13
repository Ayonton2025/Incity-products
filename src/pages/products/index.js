import React, { useState, useRef } from "react";
import { CameraIcon, PackageCheck } from "lucide-react";
import RootLayout from "../layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Loader from "@/components/Loader";
import Heading from "@/components/heading";
import { useSession, signOut } from "next-auth/react";

// Client-side logic and interaction
const Health = () => {
  const { data: session, status } = useSession();
  const [chatHistory, setChatHistory] = useState([]);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatRef = useRef(null);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const fileToGenerativePart = async (file) => {
    const base64EncodedDataPromise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsDataURL(file);
    });
    return {
      inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      alert("Please select a valid image file");
      event.target.value = null;
    }
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleImageProcessing = async () => {
    if (!file || !prompt) {
      alert("Please select an image and enter a prompt");
      return;
    }

    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const imageParts = await fileToGenerativePart(file);
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt,
          imageParts: imageParts,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(data.recommendations, data);

      if (Array.isArray(data)) {
        setResponse(data);
      } else {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          setResponse(data[keys[0]]);
        } else {
          setResponse(null); // or handle empty object case
        }
      }

      setChatHistory((prev) => [
        ...prev,
        { role: "user", parts: prompt },
        { role: "bot", parts: data },
      ]);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RootLayout>
      <div
        ref={chatRef}
        className="w-full h-full flex flex-col backdrop-blur-lg bg-black bg-opacity-75 border p-0 shadow-md z-70"
      >
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Logout
        </button>

        <Heading
          title="Product"
          description="This model recommends products from the image"
          icon={PackageCheck}
          iconColor="text-[#FF9900]"
        />

        <div className="flex p-2 flex-col gap-2 h-full overflow-y-auto">
          {/* {chatHistory.map((chat, index) => (
            <div
              key={index}
              className={`${
                chat.role === "bot" ? "bg-gray-800" : "bg-gray-700"
              } p-2 rounded-md text-white`}
            >
              {typeof chat.parts === "string"
                ? chat.parts
                : JSON.stringify(chat.parts, null, 2)}
            </div>
          ))} */}

          {loading && <Loader />}
          {error && <div className="text-red-500">{error}</div>}

          {response && response.length > 0 && (
            <div className="text-white">
              {response.map((product, index) => (
                <div
                  key={index}
                  className="border border-gray-300 p-2 rounded-md mb-2"
                >
                  <a
                    href={`/places?query=${product.name.replace(/\s+/g, "_")}`}
                  >
                    <h3 className="mt-2 text-lg font-bold">{product.name}</h3>
                    <p>{product.Description}</p>
                    <p>
                      <strong>Benefit:</strong>{" "}
                      {product.HowItwouldBenefitTheSpaceProvidedIntheImage}
                    </p>
                    <p>
                      <strong>Price: </strong>
                      {product.price}
                    </p>
                    <p>
                      <strong>Shop Name: </strong>
                      {product.shopName}
                    </p>
                    <p>
                      <strong>Address: </strong>
                      {product.shopAddress}
                    </p>
                  </a>
                  <a
                    href={product.ProductLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Buy Now
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex mx-4 p-2 bg-white rounded-md px-2 justify-between items-center">
          <input
            className="w-full border-none px-3 py-2 text-gray-700 rounded-md focus:outline-none"
            type="text"
            placeholder="Enter prompt for image"
            value={prompt}
            onChange={handlePromptChange}
          />
          <Label htmlFor="file">
            <CameraIcon className="cursor-pointer" />
          </Label>
          <Input
            id="file"
            className="hidden"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <Button
          className="bg-green-500 mx-4 py-2 mb-2 text-white text-2xl font-bold rounded-md shadow-md hover:bg-green-600 focus:outline-none mt-4"
          onClick={handleImageProcessing}
          disabled={loading}
        >
          Process Image
        </Button>
      </div>
    </RootLayout>
  );
};

export default Health;