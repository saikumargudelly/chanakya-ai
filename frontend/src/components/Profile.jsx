import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import API from '../services/api';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiMapPin, 
  FiEdit2, FiSave, FiX, FiUpload, FiLock, FiSettings 
} from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

// Avatar component
const Avatar = ({ src, onUpload, loading }) => (
  <div className="relative group">
    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg bg-gray-700">
      {src ? (
        <img 
          src={src} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
          <FiUser className="text-white text-4xl" />
        </div>
      )}
    </div>
    <label 
      className={`absolute -bottom-2 right-0 bg-teal-600 text-white p-2 rounded-full shadow-lg cursor-pointer transform transition-all duration-200 hover:scale-110 hover:bg-teal-700 ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title="Upload new photo"
    >
      <FiUpload className="w-5 h-5" />
      <input 
        type="file" 
        className="hidden" 
        accept="image/*"
        onChange={onUpload}
        disabled={loading}
      />
    </label>
  </div>
);

// Form input component
const FormInput = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = '',
  disabled = false,
  className = '',
  labelWidth = 'w-1/3',
  inputWidth = 'w-2/3',
  options = []
}) => {
  const inputClasses = `block w-full ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2 bg-gray-700 border ${
    error ? 'border-red-500' : 'border-gray-600'
  } rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 text-white placeholder-gray-400 sm:text-sm ${
    disabled ? 'bg-gray-800/50 cursor-not-allowed' : 'cursor-pointer'
  }`;

  return (
    <div className={`flex items-start ${className} mb-4`}>
      <label 
        htmlFor={name} 
        className={`${labelWidth} text-sm font-medium text-gray-300 pt-2`}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className={`${inputWidth} relative rounded-md shadow-sm`}>
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
          )}
          {type === 'select' ? (
            <select
              name={name}
              id={name}
              value={value || ''}
              onChange={onChange}
              disabled={disabled}
              className={`${inputClasses} appearance-none`}
            >
              {options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              name={name}
              id={name}
              value={value || ''}
              onChange={onChange}
              disabled={disabled}
              className={inputClasses}
              placeholder={placeholder}
            />
          )}
          {type === 'select' && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      </div>
    </div>
  );
};

// Tabs configuration
const tabs = [
  { id: 'profile', label: 'Profile', icon: <FiUser className="mr-2" /> },
  { id: 'settings', label: 'Settings', icon: <FiSettings className="mr-2" /> },
  { id: 'security', label: 'Security', icon: <FiLock className="mr-2" /> },
];

const Profile = ({ onClose }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  
  // Simplified gender options
  const genderOptions = [
    { value: '', label: 'Select gender...', disabled: true },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_number: '',
    gender: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    bio: '',
    profile_picture: ''
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: type === 'radio' ? value : value
    }));
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle radio button changes specifically
  const handleRadioChange = (value) => {
    console.log('Gender radio button changed to:', value);
    setForm(prev => {
      console.log('Updating form gender from', prev.gender, 'to', value);
      return {
        ...prev,
        gender: value
      };
    });
  };

  // Handle profile picture upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
    
    // Update form with the new image
    setForm(prev => ({
      ...prev,
      profile_picture: file
    }));
  };

  // Toggle edit mode
  const toggleEdit = () => {
    if (isEditing) {
      // If canceling edit, reset form to original values
      fetchProfile();
    }
    setIsEditing(!isEditing);
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};
    
    if (!form.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!form.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (form.mobile_number && !/^\+?[0-9\s-]{10,}$/.test(form.mobile_number)) {
      newErrors.mobile_number = 'Please enter a valid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const formData = new FormData();
      
      // Explicitly append all fields to ensure they're included
      if (form.first_name) formData.append('first_name', form.first_name);
      if (form.last_name) formData.append('last_name', form.last_name);
      if (form.email) formData.append('email', form.email);
      if (form.mobile_number) formData.append('mobile_number', form.mobile_number);
      if (form.gender) formData.append('gender', form.gender);
      if (form.date_of_birth) formData.append('date_of_birth', form.date_of_birth);
      if (form.address) formData.append('address', form.address);
      if (form.city) formData.append('city', form.city);
      if (form.state) formData.append('state', form.state);
      if (form.country) formData.append('country', form.country);
      if (form.postal_code) formData.append('postal_code', form.postal_code);
      if (form.bio) formData.append('bio', form.bio);
      if (form.profile_picture) {
        formData.append('profile_picture', form.profile_picture);
      }
      
      console.log('Submitting form with gender:', form.gender); // Debug log
      
      const response = await API.put('/auth/users/me', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Log the current state before updating
      console.log('Before update - Form gender:', form.gender);
      console.log('Before update - User data from server:', response.data);
      console.log('Before update - Current user context:', user);
      
      // Ensure we have the complete user data including gender
      const updatedUser = {
        ...user,  // Current user data
        ...response.data,  // Updated fields from the server
        gender: form.gender  // Explicitly include the gender from the form
      };
      
      console.log('Updating user with:', {
        ...updatedUser,
        // Don't log the entire user object to avoid sensitive data
        hasGender: !!updatedUser.gender,
        genderValue: updatedUser.gender
      });
      updateUser(updatedUser);
      setIsEditing(false);
      
      // Show success message
      alert('Profile updated successfully!');
      
      // Refresh profile data to ensure consistency
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(`Failed to update profile: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching user profile...');
      // Using the correct endpoint with /auth prefix
      const response = await API.get('/auth/users/me');
      const userData = response.data;
      
      console.log('Fetched user data:', {
        ...userData,
        // Don't log the entire user object to avoid sensitive data
        hasGender: !!userData.gender,
        genderValue: userData.gender
      });
      
      // Format date for date input
      if (userData.date_of_birth) {
        userData.date_of_birth = format(new Date(userData.date_of_birth), 'yyyy-MM-dd');
      }
      
      setForm(prev => {
        console.log('Updating form with user data. Previous gender:', prev.gender, 'New gender:', userData.gender);
        return {
          ...prev,
          ...userData
        };
      });
      setPreviewImage(userData.profile_picture || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render loading state
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        aria-hidden="true"
      />
      
      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="relative w-full max-w-4xl max-h-[90vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800">
            <h2 className="text-2xl font-bold text-white">Profile Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
              aria-label="Close profile"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-gray-800">
            <div className="p-6">
              {/* Profile Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <div className="flex items-center">
                  <div className="mr-6">
                    <Avatar 
                      src={previewImage || form.profile_picture} 
                      onUpload={handleImageUpload} 
                      loading={saving}
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {form.first_name} {form.last_name}
                    </h1>
                    <p className="text-gray-300">{form.email}</p>
                    <div className="mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-500/20 text-teal-400">
                        {user?.google_id ? (
                          <>
                            <FaGoogle className="mr-1.5" /> Connected with Google
                          </>
                        ) : 'Email Account'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={toggleEdit}
                    disabled={saving}
                    className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 transition-colors ${
                      isEditing 
                        ? 'bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 focus:ring-teal-500' 
                        : 'bg-teal-600 text-white hover:bg-teal-700 focus:ring-teal-500'
                    }`}
                  >
                    {isEditing ? (
                      <FiX className="-ml-1 mr-2 h-4 w-4" />
                    ) : (
                      <FiEdit2 className="-ml-1 mr-2 h-4 w-4" />
                    )}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </button>
                </div>
              </div>
              
              {/* Tabs */}
              <div className="border-b border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-teal-500 text-teal-400'
                          : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center">
                        {React.cloneElement(tab.icon, {
                          className: 'mr-2 w-5 h-5'
                        })}
                        {tab.label}
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Tab Content */}
              <div className="mt-8">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="space-y-6"
                  >
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium text-white mb-6">Personal Information</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            icon={FiUser}
                            label="First Name"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.first_name}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                          <FormInput
                            icon={FiUser}
                            label="Last Name"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.last_name}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            icon={FiMail}
                            label="Email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            disabled={true}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                          <FormInput
                            icon={FiPhone}
                            label="Mobile Number"
                            name="mobile_number"
                            type="tel"
                            value={form.mobile_number}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.mobile_number}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            icon={FiCalendar}
                            label="Date of Birth"
                            name="date_of_birth"
                            type="date"
                            value={form.date_of_birth}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.date_of_birth}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                          <div className="w-full">
                            <FormInput
                              icon={FiUser}
                              label="Gender"
                              name="gender"
                              type="select"
                              value={form.gender}
                              onChange={handleChange}
                              disabled={!isEditing || saving}
                              error={errors.gender}
                              labelWidth="w-1/3"
                              inputWidth="w-2/3"
                              options={genderOptions}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bio Section */}
                    <div className="pt-6 border-t border-gray-700">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">About</h3>
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={toggleEdit}
                            className="text-teal-400 hover:text-teal-300 text-sm font-medium flex items-center"
                          >
                            <FiEdit2 className="mr-1 h-4 w-4" />
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="bg-gray-750 rounded-lg p-4 border border-gray-700">
                        {!isEditing ? (
                          <div>
                            {form.bio ? (
                              <p className="text-gray-200 whitespace-pre-line">{form.bio}</p>
                            ) : (
                              <p className="text-gray-400 italic">No bio added yet</p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                                Tell us about yourself
                              </label>
                              <textarea
                                id="bio"
                                name="bio"
                                rows={4}
                                className="shadow-sm bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm rounded-md disabled:bg-gray-800/50 p-3"
                                value={form.bio}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Share something interesting about yourself..."
                              />
                              <p className="mt-1 text-xs text-gray-400">
                                This will be displayed on your public profile.
                              </p>
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={toggleEdit}
                                className="px-3 py-1.5 text-sm text-gray-300 hover:text-white"
                                disabled={saving}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                                disabled={saving}
                              >
                                {saving ? 'Saving...' : 'Save Changes'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Address Section */}
                    <div className="pt-6 border-t border-gray-700">
                      <h3 className="text-lg font-medium text-white mb-6">Address</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            icon={FiMapPin}
                            label="Street Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.address}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                          <FormInput
                            label="City"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.city}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="State/Province"
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.state}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                          <FormInput
                            label="Country"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.country}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="Postal Code"
                            name="postal_code"
                            value={form.postal_code}
                            onChange={handleChange}
                            disabled={!isEditing || saving}
                            error={errors.postal_code}
                            labelWidth="w-1/3"
                            inputWidth="w-2/3"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="pt-6 border-t border-gray-700 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={toggleEdit}
                          className="px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors"
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmit}
                          className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-teal-500 transition-colors"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Saving...
                            </>
                          ) : (
                            <>
                              <FiSave className="-ml-1 mr-2 h-4 w-4" />
                              Save changes
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Settings Tab */}
                {activeTab === 'settings' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-medium text-white">Account Settings</h3>
                    <p className="text-gray-300">Account settings and preferences will be available here.</p>
                  </motion.div>
                )}
                
                {/* Security Tab */}
                {activeTab === 'security' && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={fadeIn}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-medium text-white">Security</h3>
                    <p className="text-gray-300">Security settings and password management will be available here.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
