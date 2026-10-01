import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/env.js';

export const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, config.JWT.ACCESS_SECRET, {
    jwtid: randomUUID(),
    expiresIn: config.JWT.ACCESS_EXPIRES_IN
  });

  const refreshToken = jwt.sign(payload, config.JWT.REFRESH_SECRET, {
    jwtid: randomUUID(),
    expiresIn: config.JWT.REFRESH_EXPIRES_IN
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token) => {
  return jwt.verify(token, config.JWT.ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.JWT.REFRESH_SECRET);
};
