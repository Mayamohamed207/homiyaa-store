import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, Eye, EyeOff, User, Phone, Loader2, ArrowLeft, X } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const { signIn, signUp } = useAuth();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation check to ensure everything is filled completely
    if (!email.trim() || !password.trim()) {
      toast.error(t('Please fill in all credentials.', 'يرجى ملء جميع البيانات المطلوب أدناه.'));
      return;
    }

    if (isSignUp && (!fullName.trim() || !phone.trim())) {
      toast.error(t('Name and Phone Number are completely required.', 'الاسم ورقم الهاتف مطلوبان تمامًا لإنشاء الحساب.'));
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email.trim(), password, fullName.trim(), phone.trim());
        toast.success(t('Account created! Please check your email to verify.', 'تم إنشاء الحساب! يرجى التحقق من بريدك الإلكتروني للتفعيل.'));
        onClose();
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
      } else {
        await signIn(email.trim(), password);
        toast.success(t('Welcome back!', 'مرحباً بعودتك!'));
        onClose();
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
      }
    } catch (error: any) {
      if (error.message === 'EMAIL_EXISTS') {
        toast.error(t('This email address is already registered. Try logging in instead!', 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول بدلاً من ذلك!'));
      } else if (error.message === 'Invalid login credentials') {
        toast.error(t('Incorrect password or this email is not registered.', 'كلمة المرور غير صحيحة أو هذا البريد الإلكتروني غير مسجل لدينا.'));
      } else if (error.message?.toLowerCase().includes('confirmed')) {
        toast.error(t('Please check your email inbox to confirm your account first.', 'يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب أولاً.'));
      } else {
        toast.error(error.message || t('Authentication failed', 'فشلت عملية تسجيل الدخول'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        
        {/* Navigation Strip Bar */}
        <div className="auth-modal-nav-header">
          <button 
            type="button"
            onClick={onClose} 
            className="auth-back-nav-btn"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} className="auth-back-icon" />
            <span>{t('Back to Shop', 'الرجوع للمتجر')}</span>
          </button>
          
          <button 
            type="button" 
            onClick={onClose} 
            className="auth-close-btn" 
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Titles Headers */}
        <div className="auth-modal-header">
          <h2>{isSignUp ? t('Create Account', 'إنشاء حساب جديد') : t('Welcome Back', 'مرحباً بعودتك')}</h2>
          <p>{t('Please fill in your credentials to proceed', 'يرجى إدخال البيانات الخاصة بك للمتابعة')}</p>
        </div>

        {/* Input Interactive Forms Layout */}
        <form onSubmit={handleSubmit} className="auth-form-body">
          {isSignUp && (
            <>
              {/* Full Name Row Item Field */}
              <div className="auth-input-group">
                <label>
                  {t('Full Name', 'الاسم الكامل')} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="auth-field-wrapper">
                  <User className="auth-field-icon" size={18} />
                  <input
                    type="text"
                    placeholder={t('Enter your full name', 'أدخل اسمك الكامل')}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                    />
                </div>
              </div>

              {/* Phone Number Row Item Field */}
              <div className="auth-input-group">
                <label>
                  {t('Phone Number', 'رقم الهاتف')} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <div className="auth-field-wrapper">
                  <Phone className="auth-field-icon" size={18} />
                  <input
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                    />
                </div>
              </div>
            </>
          )}

          {/* Email Row Item Field */}
          <div className="auth-input-group">
            <label>
              {t('Email Address', 'البريد الإلكتروني')} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="auth-field-wrapper">
              <Mail className="auth-field-icon" size={18} />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                />
            </div>
          </div>

          {/* Password Row Item Field */}
          <div className="auth-input-group">
            <label>
              {t('Password', 'كلمة المرور')} <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <div className="auth-field-wrapper">
              <Lock className="auth-field-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Action Control Buttons */}
          <button type="submit" className="auth-submit-action-btn" disabled={loading}>
            {loading ? (
              <div className="auth-loading-spinner-box">
                <Loader2 className="auth-spinner" size={18} />
                <span>{t('Processing...', 'جاري المعالجة...')}</span>
              </div>
            ) : (
              <span>{isSignUp ? t('Register Now', 'سجل الآن') : t('Sign In', 'تسجيل الدخول')}</span>
            )}
          </button>
        </form>

        {/* Auth Sub Footer Controls */}
        <div className="auth-modal-footer-switch">
          <span>
            {isSignUp 
              ? t('Already have an account?', 'هل لديك حساب بالفعل؟') 
              : t("Don't have an account?", 'ليس لديك حساب؟')
            }
          </span>
          <button
            type="button"
            className="auth-switch-toggle-action-btn"
            onClick={() => setIsSignUp(!isSignUp)}
            disabled={loading}
          >
            {isSignUp ? t('Sign In', 'تسجيل الدخول') : t('Create Account', 'إنشاء حساب جديد')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;