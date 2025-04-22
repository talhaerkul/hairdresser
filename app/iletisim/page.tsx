"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { contactData } from "@/lib/data/contact";
import { footerData } from "@/lib/data/footer";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Form doğrulama
    if (!name || !email || !message || !subject) {
      toast.error("Lütfen tüm alanları doldurun.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Burada gerçek bir API çağrısı yapılabilir
      // Örnek olarak simüle edilmiştir
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(contactData.form.successMessage);
      setName("");
      setEmail("");
      setMessage("");
      setSubject("");
    } catch (error) {
      toast.error(contactData.form.errorMessage);
      console.error("İletişim hatası:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              {contactData.title}
            </h1>
          </div>

          <div className="border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Sol Taraf - İletişim Bilgileri */}
              <div className="p-6 bg-gray-50">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  {contactData.contactInfo.title}
                </h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {contactData.contactInfo.address.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                      {contactData.contactInfo.address.value}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {contactData.contactInfo.phone.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {contactData.contactInfo.phone.value}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {contactData.contactInfo.email.label}
                    </h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {contactData.contactInfo.email.value}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      {contactData.contactInfo.workingHours.label}
                    </h3>
                    <div className="mt-1 text-sm text-gray-900">
                      {contactData.contactInfo.workingHours.value.map(
                        (hours, index) => (
                          <p key={index}>{hours}</p>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">
                    {contactData.socialMedia.title}
                  </h3>
                  <div className="flex space-x-4">
                    {footerData.socialMedia.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <span className="sr-only">{social.name}</span>
                        <svg
                          className="h-6 w-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d={social.icon}
                            clipRule="evenodd"
                          />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sağ Taraf - İletişim Formu */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  {contactData.form.title}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {contactData.form.fields.name}
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {contactData.form.fields.email}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="subject"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {contactData.form.fields.subject}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium text-gray-700"
                    >
                      {contactData.form.fields.message}
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-1 p-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    ></textarea>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
                    >
                      {isSubmitting
                        ? contactData.form.button.sending
                        : contactData.form.button.submit}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
