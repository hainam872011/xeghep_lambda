const jwt = require('jsonwebtoken')
export const verify = async (token) => {
  const jwtKey = "TivwhguG5SkiVyYcakcnhyZJEE9UEMF72zmPWZKo"
  return jwt.verify(token, jwtKey, (error, res) => {
    if (error) return {verified: false}
    return {verified: true, res}
  });
}
