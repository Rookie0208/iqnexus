import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../Api";
import { Settings, Save, Send, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";

const ResultConfigPanel = ({ subject, classLevel, onConfigChange }) => {
  const [config, setConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // Topic names for each section
  const [topicNames, setTopicNames] = useState({
    section1: 'Topic 1',
    section2: 'Topic 2',
    section3: 'Topic 3',
    section4: 'Topic 4',
    section5: 'Topic 5'
  });

  // Rank visibility toggles
  const [rankVisibility, setRankVisibility] = useState({
    schoolRank: true,
    zonalRank: true,
    nationalRank: true,
    internationalRank: true,
    classRank: true,
    sectionRank: true
  });

  // Fetch config when subject/class changes
  useEffect(() => {
    if (subject && classLevel) {
      fetchConfig();
    }
  }, [subject, classLevel]);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/result-config`, {
        params: { subject, classLevel }
      });
      if (res.data.success && res.data.config) {
        setConfig(res.data.config);
        setTopicNames(res.data.config.topicNames || topicNames);
        setRankVisibility(res.data.config.rankVisibility || rankVisibility);
        if (onConfigChange) {
          onConfigChange(res.data.config);
        }
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await axios.post(`${BASE_URL}/result-config`, {
        subject,
        classLevel,
        topicNames,
        rankVisibility
      });
      if (res.data.success) {
        setConfig(res.data.config);
        if (onConfigChange) {
          onConfigChange(res.data.config);
        }
        alert("Configuration saved successfully!");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (publish = true) => {
    setIsPublishing(true);
    try {
      const res = await axios.post(`${BASE_URL}/publish-results`, {
        subject,
        classLevel,
        publish
      });
      if (res.data.success) {
        setConfig(res.data.config);
        if (onConfigChange) {
          onConfigChange(res.data.config);
        }
        alert(publish ? "Results published to students!" : "Results unpublished.");
      }
    } catch (error) {
      console.error("Error publishing results:", error);
      alert("Failed to publish/unpublish results.");
    } finally {
      setIsPublishing(false);
    }
  };

  const toggleRank = (rankKey) => {
    setRankVisibility(prev => ({
      ...prev,
      [rankKey]: !prev[rankKey]
    }));
  };

  const rankLabels = {
    schoolRank: 'School Rank',
    classRank: 'Class Rank',
    sectionRank: 'Section Rank',
    zonalRank: 'Zonal/City Rank',
    nationalRank: 'National Rank',
    internationalRank: 'International Rank'
  };

  if (!subject || !classLevel) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setShowConfig(!showConfig)}
      >
        <div className="flex items-center gap-2">
          <Settings className="text-purple-600" size={20} />
          <span className="font-semibold text-gray-800">Result Configuration</span>
          {config?.isPublished && (
            <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
              <Check size={12} />
              Published
            </span>
          )}
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          {showConfig ? '▲' : '▼'}
        </button>
      </div>

      {showConfig && (
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-purple-600" size={24} />
              <span className="ml-2 text-gray-600">Loading configuration...</span>
            </div>
          ) : (
            <>
              {/* Topic Names Configuration */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Topic Names for SPR (Subject Performance Report)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(topicNames).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1">
                        {key.replace('section', 'Section ')}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTopicNames(prev => ({ ...prev, [key]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder={`Enter topic name for ${key}`}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  These topic names will appear in the Subject Performance Report (SPR) section of the result card.
                </p>
              </div>

              {/* Rank Visibility Configuration */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Rank Display Settings
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(rankLabels).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => toggleRank(key)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                        rankVisibility[key]
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 bg-gray-50 text-gray-500'
                      }`}
                    >
                      {rankVisibility[key] ? (
                        <Eye size={16} className="text-purple-500" />
                      ) : (
                        <EyeOff size={16} className="text-gray-400" />
                      )}
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Toggle which ranks should be visible on the student result cards.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>

                {config?.isPublished ? (
                  <button
                    onClick={() => handlePublish(false)}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {isPublishing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <X size={18} />
                    )}
                    {isPublishing ? 'Processing...' : 'Unpublish Results'}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePublish(true)}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md"
                  >
                    {isPublishing ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    {isPublishing ? 'Publishing...' : 'Publish Results to Students'}
                  </button>
                )}
              </div>

              {/* Publish Status Info */}
              <div className={`mt-4 p-3 rounded-lg ${config?.isPublished ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <p className={`text-sm ${config?.isPublished ? 'text-green-700' : 'text-yellow-700'}`}>
                  {config?.isPublished ? (
                    <>
                      <strong>Published:</strong> Students can view their results. 
                      Published on: {config.publishedAt ? new Date(config.publishedAt).toLocaleString() : 'N/A'}
                    </>
                  ) : (
                    <>
                      <strong>Not Published:</strong> Students cannot view their results yet. 
                      Save configuration and click "Publish Results" when ready.
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ResultConfigPanel;
