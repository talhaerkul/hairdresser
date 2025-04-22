import React from "react";
import { aboutData } from "@/lib/data/about";

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              {aboutData.title}
            </h1>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <div className="prose max-w-none">
              <p className="text-lg text-gray-700 mb-6">{aboutData.intro}</p>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                {aboutData.mission.title}
              </h2>
              <p className="text-gray-700 mb-6">{aboutData.mission.content}</p>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                {aboutData.vision.title}
              </h2>
              <p className="text-gray-700 mb-6">{aboutData.vision.content}</p>

              <h2 className="text-xl font-semibold text-gray-800 mt-8 mb-4">
                {aboutData.values.title}
              </h2>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                {aboutData.values.items.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
