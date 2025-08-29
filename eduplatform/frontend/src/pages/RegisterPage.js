import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, UserPlus, Phone } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    user_type: 'student',
    password: '',
    password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    // Clear specific error when user starts typing
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Client-side validation
    const newErrors = {};
    
    if (formData.password !== formData.password_confirm) {
      newErrors.password_confirm = "Passwords don't match";
    }
    
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrors(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join EduPlatform and start your learning journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="form-input"
                placeholder="John"
                required
              />
              {errors.first_name && <div className="form-error">{errors.first_name}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="form-input"
                placeholder="Doe"
                required
              />
              {errors.last_name && <div className="form-error">{errors.last_name}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="johndoe"
                required
              />
            </div>
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="john@example.com"
                required
              />
            </div>
            {errors.email && <div className="form-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            {errors.phone_number && <div className="form-error">{errors.phone_number}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Account Type</label>
            <select
              name="user_type"
              value={formData.user_type}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {errors.user_type && <div className="form-error">{errors.user_type}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="Minimum 8 characters"
                required
              />
            </div>
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                name="password_confirm"
                value={formData.password_confirm}
                onChange={handleChange}
                className="form-input pl-10"
                placeholder="Confirm your password"
                required
              />
            </div>
            {errors.password_confirm && <div className="form-error">{errors.password_confirm}</div>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full mb-4"
          >
            {loading ? (
              <div className="loading-spinner" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;