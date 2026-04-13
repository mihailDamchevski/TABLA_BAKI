# Jira Setup TODO (Mario + Mihail)

## Goal
Create one Jira project for TABLA_BAKI and set up basic team workflow for two people.

## 1) Create Jira project
- [ ] Create project name: `TABLA_BAKI`
- [ ] Project key: `TB`
- [ ] Template: `Scrum` (or `Kanban` if no sprints yet)
- [ ] Set project lead: Mario

## 2) Add team members
- [ ] Invite Mario
- [ ] Invite Mihail
- [ ] Give both `Admin` or `Developer` permissions (as needed)

## 3) Create issue types
- [ ] Epic
- [ ] Story
- [ ] Task
- [ ] Bug

## 4) Create initial workflow
- [ ] `Backlog`
- [ ] `Selected for Development`
- [ ] `In Progress`
- [ ] `Code Review`
- [ ] `Testing`
- [ ] `Done`

## 5) Create board columns
- [ ] Backlog
- [ ] In Progress
- [ ] Review
- [ ] Done

## 6) Create labels/components
- [ ] `frontend`
- [ ] `backend`
- [ ] `devops`
- [ ] `multiplayer`
- [ ] `bug`

## 7) Add first epic + stories
- [ ] Epic: `Online Multiplayer`
- [ ] Story: `Room creation with random ID`
- [ ] Story: `Join room by ID and nickname`
- [ ] Story: `WebSocket real-time move sync`
- [ ] Story: `Reconnect handling for dropped clients`

## 8) Assignment split (initial)
- [ ] Assign backend room/websocket stories to Mihail
- [ ] Assign frontend room/join UI stories to Mario
- [ ] Keep one shared DevOps task for deployment/logging

## 9) Definition of Done (project-level)
- [ ] Code merged to main
- [ ] Basic tests pass
- [ ] Manual test completed
- [ ] Jira ticket has notes/screenshots
- [ ] Ticket moved to Done

## 10) Optional but recommended
- [ ] Connect Jira with GitHub repo
- [ ] Enforce branch naming with ticket key (example: `TB-12-room-websocket`)
- [ ] Auto-link PRs/commits to Jira issues
