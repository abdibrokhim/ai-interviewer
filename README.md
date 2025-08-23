### **PROJECT DOCUMENTATION: Job Portal with AI Agents powered Interviews**

## **Overview**

The platform automates the recruitment process using an AI Interviewer Agent that can conduct video-based interviews, assess technical coding skills, and provide feedback automatically. The platform supports candidates, employers, and admins, with credit-based billing for employers to access premium features like interviews and advanced search.

## **Key Features**

| Module | Features |
| ----- | ----- |
| Candidate | Resume parsing, profile creation, job applications,View Assigned Interviews, attend AI Interviews |
| Employer | Natural language talent search, candidate profile viewing, AI interview assignment/creation, candidates shortlisting (kanban style \- interview scheduled, selected for next round, offer sent), billing. |
| Admin | Manage users (candidates, employers), transactions, job listings, AI config, usage & analytics |
| AI Interviewer | Video/audio-based screening, coding interviews, transcripts, scoring |
| Billing | Credit-based system, packages, payment gateway integration, invoice history |

**The Platform has three dashboards:-**

1. Candidate Dashboard  
2. Employer Dashboard  
3. Admin Dashboard

### **Candidate Dashboard**

**Step-by-Step Flow:**

1. **Landing Page Visit**

   * Candidate clicks **“I’m a candidate”**

   * Prompted to upload **Resume (PDF/DOCX)**

2.  **Sign-up/Login Page**

   * Resume parsed with AI → Name, Email, Skills, Experience auto-filled

   * The candidate completes his/her profile (can edit auto-filled data) and creates an account by setting a username/email and password.

3. **Dashboard (Post Login)**

   * View and apply to job listings  
   * View applied jobs  
   * Check interviews assigned  
   * Reschedule interview (if assigned)

4. **Interview Process**

   * Receives email with AI Interview link and timing \+ able to see interviews assigned within the platform itself.

   * Option to **Reschedule (once)**

   * AI Agent conducts live/video interview (voice \+ video \+ code editor)

   * Interview result sent to employer: auto-evaluated with feedback, strengths/weaknesses, transcript  **(Note: CANDIDATE CANNOT VIEW HIS SCORE/FEEDBACK, ONLY SHOWN TO EMPLOYER)**

**Employer Dashboard**

1. **Sign up/Login (have an option for login via company SSO)**

   * Create a company profile, description, size of the company, location, etc.  
   * Choose a subscription plan

2. **Dashboard Overview**

   **Job Listings Management**:  
   * Create/Edit/Delete job listings.  
   * Fields: Job title, description, tech stack, experience range, salary range, location, remote/hybrid.  
   * View candidates applied to a job listing, assign interviews to candidates.  
   * The AI agent will parse all the resumes and show the best candidates for the job listing.

   **Candidate Search bar (AI-powered)**:

   * Use a natural language prompt, e.g., "Looking for a Senior Java Developer with Spring Boot and 10 years of experience."  
   * View matching candidates profiles by parsing their resumes.  
   * AI will scan for candidates information on github, linkedin and other sources for information.

   **Candidate Profile View**:

   * See parsed resume, skills and experience summary.

   **Interview Creation/Assignment**:

1. Create an interview   
2. Enter name of the candidate  
3. Enter email of the candidate   
4. Upload candidates Resume  
5. Enter Interview subject and description (shown to the user in the form of email subject and body)  
6. Select Type of Interview (Technical screening, coding interview, behavioral, and situational, mixed (non-technical \+ coding))  
7. Set number of questions  
8. Enter Skills to be assessed/evaluation keywords (java, react, sql, english, french)  
9. Set depth for each question (Low, Medium, High) will go deeper into the same topic based on the candidate's answer.  
10. Set Questions Manually/Upload Job Description PDF (AI will auto-generate questions)/Templates Library (eg: Software Engineer I template \- will have various questions sourced from web and AI generated as well and no repetion)  
11. Set number of minutes (duration of the interview 10 , 15, 30 minutes, custom)  
12. Set date and time of the interview  
13. Send an interview invite (show approx credits to be utilized before sending invite)

Upon clicking ‘Send an interview invite’ an email would be sent to the candidate.

Scenario 1:

If the candidate is part of the platform already, the employer can select the candidate on the applicants list for their job posting and click  ‘’assign an interview’’ to a suitable candidate and the above steps will be followed \- “create an interview” and so on..

Scenario 2:-

If the candidate is not part of the platform, the employer can still create an interview and send an email invite to the candidate by following the same process of interview assignment/creation.

**Interview Feedback Access**:

* View transcript, video, and scores post-interview.  
* Option to shortlist, reject, or mark as follow-up

**Credits & Billing:**

* View current credit balance/purchase credits and change subscription plan

---

### 

### 

### 

### 

### 

### 

### **Admin Dashboard**

* **User Management:**  
  * View all candidates and employers  
  * Approve, suspend, or delete account**s**  
* **Job Listings Oversight:**  
  * View all posted jobs  
  * Flag inappropriate content  
* **Credit System Management:**  
  * Set global credit rate per interview minute  
  * Configure pricing packages  
  * View all employer purchases  
* **AI Question Library (shown in interview creation process for employers):**  
  * Able to use question templates per job role (eg : flutter developer questions template, software engineer questions template, AI generated and modified questions sourced from various sources on the web )  
* **Interview Logs:**  
  * View all interviews conducted  
  * View issues/errors logs if any  
* **Revenue Analytics:**  
  * Total interviews run  
  * Credit revenue stats  
  * Most popular job roles and stacks

## 

## 

## 

## 

## **AI Interviewer Agent Capabilities**

## **Features:**

* **Live Video/Audio AI Interview**:  
  * Candidate joins through unique link  
  * AI Agent welcomes and begins asking questions  
  * Voice \+ facial sentiment analysis  
* **Technical Coding Round**:  
  * Built-in code editor with syntax highlighting  
  * Run code and evaluate outputs  
  * Languages: Java, Python, JavaScript, C++  
* **Scoring & Feedback**:  
  * Auto-generated based on answers  
  * Scores in Communication, Technical, Problem Solving, Confidence  
  * Full transcript stored and available to employers.  
* **Fine-tuning:**  
  * Won’t reveal answers to the candidates when they ask for hints or try to fool the agent.   
  * Will behave as an interviewer always and won’t let candidates divert to a different topic other than the scope of the interview.  
  * Avoid off-topic behavior and intent.   
  * Don’t reveal any technical details of the product (LLM model, API’s used, candidates score)  
* **Cheating Detection:**  
  * Tab switching \- If a candidate goes to another tab, the user is warned and flagged if he does it more than 2 times, the interview ends immediately.  
  * Multiple people appearing in the video \- if there is more than 1 person in the video, it will raise a flag and end the interview automatically.

| Function | Description |
| ----- | ----- |
| Resume Parser | Extracts name, skills, companies, roles, education, summary |
| Video Interview Analysis | Uses face \+ voice detection to assess confidence, tone, and body language |
| Coding Interview Evaluator | Real-time code editor \+ test case evaluator for technical questions |
| Question Generator | Dynamic question set based on employer input or job role |
| Feedback Generator | Generates scorecards: Communication, Technical, Problem-solving, etc. |
| Transcript Engine | Stores full transcript of interview and response breakdown |

## 

## **Credits & Billing System**

* **Credits** are used to schedule and conduct interviews.  
* Employers **purchase credits** via the billing/subscription page.  
* **1 Interview minute \= 1 credit**  
* **Billing Features:**

  * Razorpay/UPI/Stripe integration

  * Download invoices

  * Auto-recharge option

  * Credit usage history

## **Email/Notification Flow**

| Event | Email Sent To | Content |
| ----- | ----- | ----- |
| Candidate Interview Scheduled | Candidate  | Link \+ Time \+ Reschedule Option |
| Interview Rescheduled | Employer & Candidate | Updated time/link |
| Credits Low | Employer | Reminder to buy credits |
| Admin Alerts | Admin | Abuse report, server issues, etc. |

