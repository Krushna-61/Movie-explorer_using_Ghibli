"use client";

import { SignJWT, jwtVerify } from "jose";

export type RegisterInput = { email: string; password: string };
export type LoginInput = { email: string; password: string };
export type DecodedToken = { sub: string; email: string; iat: number; exp: number };

const USERS_KEY = "users";
const SECRET = new TextEncoder().encode("movie-explorer-secret");

type StoredUser = { id: string; email: string; passwordHash: string };

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

export async function register({ email, password }: RegisterInput): Promise<{ token: string; user: { id: string; email: string } }> {
  const users = loadUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) throw new Error("Email already registered");
  const newUser: StoredUser = {
    id: crypto.randomUUID(),
    email,
    passwordHash: simpleHash(password),
  };
  users.push(newUser);
  saveUsers(users);
  const token = await createToken(newUser.id, newUser.email);
  return { token, user: { id: newUser.id, email: newUser.email } };
}

export async function login({ email, password }: LoginInput): Promise<{ token: string; user: { id: string; email: string } }> {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");
  if (user.passwordHash !== simpleHash(password)) throw new Error("Invalid credentials");
  const token = await createToken(user.id, user.email);
  return { token, user: { id: user.id, email: user.email } };
}

async function createToken(userId: string, email: string): Promise<string> {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
  return token;
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      sub: (payload.sub as string) ?? "",
      email: (payload.email as string) ?? "",
      iat: Number(payload.iat ?? 0),
      exp: Number(payload.exp ?? 0),
    };
  } catch {
    return null;
  }
}


