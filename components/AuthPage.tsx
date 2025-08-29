/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  return isLogin ? (
    <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
  ) : (
    <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
  );
};

export default AuthPage;
