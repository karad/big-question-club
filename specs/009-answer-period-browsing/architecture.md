# Current Application Architecture

**Recorded**: 2026-09-02

This diagram shows the screens, HTTP APIs, WebMCP tools, and their dependencies after SPEC 009 completion.

```mermaid
flowchart LR
    Human["Human"]
    Agent["Personal Agent"]

    subgraph Browser["Browser"]
        direction TB

        subgraph Screens["Screens — Hono JSX / SSR"]
            SiteHeader["Shared Header<br/>Big Question Club logo"]
            Home["Home<br/>GET /"]
            NewQuestion["New Question<br/>GET /questions/new"]
            MyQuestions["My Questions<br/>GET /my/questions"]
            EditQuestion["Edit Question<br/>GET /questions/:questionId/edit"]
            ReviewQuestion["Review & Publish<br/>GET /questions/:questionId/review"]
            QuestionDetail["Question Detail<br/>GET /questions/:questionId"]
            AdminDashboard["Admin Dashboard<br/>GET /club-operations"]
            AdminLists["Admin Tables<br/>GET /club-operations/{users|questions|answers|audit-log}"]
        end

        Client["Client Entry<br/>client.ts"]

        subgraph WebMCP["WebMCP Tools"]
            GetQuestionTool["get_question"]
            SubmitAnswerTool["submit_answer"]
            UpdateAnswerTool["update_answer"]
            RemoveAnswerTool["remove_answer"]
            GetMySubmissionTool["get_my_submission"]
        end
    end

    subgraph Worker["Cloudflare Worker — Hono"]
        direction TB

        subgraph ManagementActions["Question Management Actions"]
            CreateQuestion["Create Question<br/>POST /questions"]
            UpdateQuestion["Update Draft<br/>POST /questions/:questionId/edit"]
            PublishQuestion["Publish Question<br/>POST /questions/:questionId/publish"]
        end

        subgraph AdminActions["Admin Actions"]
            DeleteAdminQuestion["Delete Question<br/>POST /club-operations/questions/:id/delete"]
            DeleteAdminAnswer["Delete Answer<br/>POST /club-operations/answers/:id/delete"]
            BanAdminUser["Ban User<br/>POST /club-operations/users/:id/ban"]
            UnbanAdminUser["Unban User<br/>POST /club-operations/users/:id/unban"]
        end

        subgraph APIs["HTTP APIs"]
            AuthAPI["Authentication<br/>ALL /api/auth/*"]
            WhoAmIAPI["Current Identity<br/>GET /api/who-am-i"]

            GetQuestionAPI["Get Open Question<br/>GET /api/questions/:questionId"]
            SubmitAnswerAPI["Submit Answer<br/>POST /api/questions/:questionId/answers"]
            UpdateAnswerAPI["Update Own Answer<br/>PUT /api/questions/:questionId/my-answer"]
            RemoveAnswerAPI["Remove Own Answer<br/>DELETE /api/questions/:questionId/my-answer"]
            MySubmissionAPI["Get Own Submission<br/>GET /api/questions/:questionId/my-submission"]

            AnswerDetailAPI["Get Revealed Answer Body<br/>GET /api/questions/:questionId/answers/:answerId"]

            VerificationAPI["Safety Verification Question<br/>GET /api/agent-safety-verification-questions/:caseId"]
            HealthAPI["Health Check<br/>GET /health"]
        end

        Authentication["Better Auth"]
        Domain["Domain Rules<br/>Question lifecycle<br/>Answer visibility<br/>Browsing presentation"]
        Repository["Question Repository<br/>Drizzle ORM + atomic D1 statements"]
        AdminRepository["Admin Repository<br/>Authorization / Lists / Moderation / Audit"]
    end

    subgraph Storage["Storage / External Services"]
        D1[("Cloudflare D1<br/>Users / Sessions / Questions / Answers<br/>Banned Users / Audit Logs")]
        Google["Google OAuth"]
    end

    Human --> Home
    Human --> NewQuestion
    Human --> MyQuestions
    Human --> EditQuestion
    Human --> ReviewQuestion
    Human --> QuestionDetail
    Human --> AdminDashboard
    AdminDashboard --> AdminLists

    SiteHeader --> Home
    SiteHeader --> NewQuestion
    SiteHeader --> MyQuestions
    SiteHeader --> EditQuestion
    SiteHeader --> ReviewQuestion
    SiteHeader --> QuestionDetail
    SiteHeader --> AdminDashboard
    SiteHeader --> AdminLists

    Home --> QuestionDetail
    Home --> NewQuestion
    Home --> MyQuestions

    MyQuestions --> EditQuestion
    MyQuestions --> ReviewQuestion
    MyQuestions --> QuestionDetail

    NewQuestion --> CreateQuestion
    CreateQuestion --> ReviewQuestion

    EditQuestion --> UpdateQuestion
    UpdateQuestion --> ReviewQuestion

    ReviewQuestion --> PublishQuestion
    PublishQuestion --> QuestionDetail

    Screens --> Client
    Client --> WhoAmIAPI
    Client --> AuthAPI
    Client --> AnswerDetailAPI

    Client --> GetQuestionTool
    Client --> SubmitAnswerTool
    Client --> UpdateAnswerTool
    Client --> RemoveAnswerTool
    Client --> GetMySubmissionTool

    Agent --> GetQuestionTool
    Agent --> SubmitAnswerTool
    Agent --> UpdateAnswerTool
    Agent --> RemoveAnswerTool
    Agent --> GetMySubmissionTool

    GetQuestionTool --> GetQuestionAPI
    SubmitAnswerTool --> SubmitAnswerAPI
    UpdateAnswerTool --> UpdateAnswerAPI
    RemoveAnswerTool --> RemoveAnswerAPI
    GetMySubmissionTool --> MySubmissionAPI

    AuthAPI --> Authentication
    WhoAmIAPI --> Authentication

    Authentication --> Google
    Authentication --> D1

    AdminDashboard --> AdminRepository
    AdminDashboard --> DeleteAdminQuestion
    AdminDashboard --> DeleteAdminAnswer
    AdminDashboard --> BanAdminUser
    AdminDashboard --> UnbanAdminUser
    AdminActions --> AdminRepository
    AdminRepository --> D1

    Screens --> Domain
    ManagementActions --> Domain
    APIs --> Domain

    Screens --> Repository
    ManagementActions --> Repository
    APIs --> Repository
    Repository --> D1
```

WebMCP tools are registered from browser-side `client.ts` and call the corresponding existing HTTP APIs. Screens and WebMCP share the same Worker, domain, and repository for authentication, Question state, and Answer-disclosure decisions. Administration compares the Google Session with the configured email so only the administrator can list, delete, and ban.
