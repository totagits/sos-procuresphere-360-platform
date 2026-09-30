import { randomUUID } from "node:crypto";
import { Router } from "express";
import { appendAuditEvent } from "../../lib/audit";
import { getPermissionsForUser, getUser } from "../../lib/policy";
import { getActorId } from "../../lib/http";
import { getState, resetState, setState } from "../../lib/state";

export const authRouter = Router();

authRouter.get("/bootstrap", (_request, response) => {
  const state = getState();
  response.json({
    users: state.users.map((user) => ({
      ...user,
      roles: state.roles.filter((role) => user.roleIds.includes(role.id))
    })),
    locations: state.locations,
    departments: state.departments
  });
});

authRouter.get("/users", (_request, response) => {
  const state = getState();
  response.json(
    state.users.map((user) => ({
      ...user,
      roles: state.roles.filter((role) => user.roleIds.includes(role.id))
    }))
  );
});

authRouter.post("/login", (request, response) => {
  const state = getState();
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const user = state.users.find((entry) => entry.email.toLowerCase() === email);

  if (!user) {
    response.status(404).json({ message: "User not found in demo directory." });
    return;
  }

  response.json({
    user,
    permissions: getPermissionsForUser(state, user.id),
    roles: state.roles.filter((role) => user.roleIds.includes(role.id))
  });
});

authRouter.post("/signup", (request, response) => {
  const state = getState();
  const name = String(request.body?.name ?? "").trim();
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const title = String(request.body?.title ?? "").trim();
  const locationId = String(request.body?.locationId ?? "").trim();
  const departmentId = String(request.body?.departmentId ?? "").trim();

  if (!name || !email || !title || !locationId || !departmentId) {
    response.status(400).json({ message: "Name, work email, title, location, and department are required." });
    return;
  }

  if (!email.includes("@")) {
    response.status(400).json({ message: "A valid work email address is required." });
    return;
  }

  if (state.users.some((entry) => entry.email.toLowerCase() === email)) {
    response.status(409).json({ message: "That email already has access. Please sign in instead." });
    return;
  }

  const location = state.locations.find((entry) => entry.id === locationId);
  const department = state.departments.find((entry) => entry.id === departmentId);
  const requesterRole = state.roles.find((entry) => entry.id === "role-requester");

  if (!location || !department || !requesterRole) {
    response.status(400).json({ message: "The selected access profile is not available." });
    return;
  }

  const timestamp = new Date().toISOString();
  const user = {
    id: `user-${randomUUID().slice(0, 8)}`,
    name,
    email,
    title,
    roleIds: [requesterRole.id],
    departmentId,
    locationId,
    totpEnabled: false,
    lastLoginAt: timestamp
  };

  const nextState = setState((draft) => {
    draft.users.unshift(user);
    draft.notifications.unshift({
      id: `notif-${randomUUID().slice(0, 8)}`,
      title: "New access provisioned",
      body: `${name} was provisioned as a Programme Requester for ${location.name} / ${department.name}.`,
      severity: "info",
      audienceRoleIds: ["role-admin"],
      dueAt: timestamp,
      escalated: false
    });
    appendAuditEvent(draft, {
      actorId: user.id,
      actorName: user.name,
      action: "user.registered",
      entityType: "user",
      entityId: user.id,
      detail: `Self-service account provisioned for ${title} at ${location.name}.`
    });
    return draft;
  });

  response.status(201).json({
    user,
    permissions: getPermissionsForUser(nextState, user.id),
    roles: nextState.roles.filter((role) => user.roleIds.includes(role.id))
  });
});

authRouter.get("/session", (request, response) => {
  const state = getState();
  const user = getUser(state, getActorId(request));
  response.json({
    user,
    permissions: getPermissionsForUser(state, user.id),
    roles: state.roles.filter((role) => user.roleIds.includes(role.id))
  });
});

authRouter.post("/reset-demo", (_request, response) => {
  response.json({ state: resetState(), message: "Demo state reset." });
});
