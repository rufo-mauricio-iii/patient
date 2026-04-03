# Turbo AI Challenge — Sprint 1 Scope (Source of Truth)

**Last Updated:** 2026-04-02
**Client:** Alex — Medical Supply Distribution Company
**Deadline:** Saturday, April 4, 1:28 PM PT

---

## Problem Statement

Alex's team manages patient orders and billing through a fragile Excel spreadsheet with hidden lookup tables. One broken field cascades errors across the sheet. The team re-enters data across disconnected tools (Excel → SharePoint → DocuSign → vendor portals), wasting hours per order and introducing errors.

**Core Insight:** The team spends more time fighting the spreadsheet than processing orders. Everything downstream (docs, approvals, vendor orders) depends on reliable, structured order data.

---

## Stakeholders

| Role | Who | Current Responsibilities |
|---|---|---|
| **Therapist** (external) | PT clinic staff | Prescribes products, sends order + measurement forms |
| **Employee** (order processor) | Alex's team | Enters orders, generates docs, sends invoices, places vendor orders |
| **Manager** | Senior team member | Approves orders with certain HCPCS codes |
| **Patient** (external) | End recipient | Receives invoice, pays, receives product, signs POD |
| **Vendor** (external) | Medi, etc. | Fulfills and drop-ships product to patient |
| **Insurance/Payer** (external) | Insurance companies | Pays Alex's company for covered items |

---

## Current-State Process

### Phase 1: Order Intake (PAIN: Fragile Excel)
1. **Therapist** sends order to Alex's team (phone, fax, email)
2. **Employee** opens Excel spreadsheet
3. Employee manually enters: patient info, insurance, HCPCS codes, product selections, vendor info
4. Excel auto-calculates from hidden tables: cost per unit, billable amount, patient responsibility, margin
5. **PROBLEMS:** Fragile formulas, hidden tables, no validation, errors caught late

### Phase 2: Approval (PAIN: Disconnected system)
6. IF certain HCPCS codes → Employee creates approval request in SharePoint
7. **Manager** reviews and approves/rejects in SharePoint
8. **PROBLEMS:** Separate system, manual, easy to lose track

### Phase 3: Document Generation (PAIN: Manual assembly)
9. **Employee** manually generates 3 documents from Excel data:
   - **Encounter Form** — internal order summary → saved as PDF, uploaded to patient record
   - **Patient Invoice** — with Stripe payment link → sent via DocuSign
   - **Proof of Delivery (POD)** — sent after delivery for patient signature
10. **PROBLEMS:** Manual PDF creation, copy-paste into DocuSign

### Phase 4: Patient Payment
11. **Patient** receives invoice via DocuSign, signs, pays via Stripe link
12. **Employee** confirms payment received
13. **PROBLEMS:** Manual payment tracking

### Phase 5: Vendor Order (PAIN: Full data re-entry)
14. **Employee** goes to vendor portal, manually re-enters all order info, places order
15. **Vendor** drop-ships to patient
16. **PROBLEMS:** Complete re-entry of data already in Excel, must know correct vendor portal

### Phase 6: Delivery Confirmation
17. **Employee** sends POD via email to patient
18. **Patient** signs POD and returns
19. **Employee** uploads signed POD to patient record
20. **PROBLEMS:** Manual email, manual tracking

### Phase 7: Insurance Billing
21. **Employee** submits claim to insurance using encounter form + documentation
22. **Insurance** pays Alex's company
23. (Largely outside scope of this tool)

---

## Sprint 1 — Proposed Flow

**One-liner:** A web-based order entry system with auto-calculated billing and auto-generated documents, backed by admin-managed reference tables, with a dashboard to track all orders.

### What Changes for the Team on Day 1

| Today | After Sprint 1 |
|---|---|---|
| Open fragile Excel file | Open web app |
| Manually enter + hope formulas work | Select from dropdowns, system calculates |
| No validation until something breaks | Errors caught at input time |
| Hidden lookup tables nobody can maintain | Admin-managed product + fee schedule tables |
| No visibility into order pipeline | Dashboard shows all orders + status |
| Tribal knowledge on prior auth / measurements | Flags built into the product data |
| Manually assemble encounter form + invoice | Auto-generated PDFs on order save |
| Copy-paste data into invoice template | Invoice auto-populated with Stripe link field |

### Sprint 1 Features

#### A. Order Entry Form (Two-Column Layout)
**Left column:**
1. **Patient Info** — First name, middle name, last name, suffix, DOB, address, shipping address (with "same as patient" checkbox), insurance/payer (dropdown), state, self-pay checkbox
2. **Product Selection** — Select from product dropdown (pulls from Product Table), each line item auto-fills: vendor, HCPCS code, cost. Quantity input. Self-pay → defaults to MSRP.
3. **Visual Flags** — "Measurement form required" (yellow badge), "Prior auth required" (red badge) per line item
4. **Measurement Form Upload** — Per line item file upload (PDF, JPG, PNG, max 5MB) for products flagged as requiring measurement. "Measurement Pending" warning when file not yet uploaded. Viewable/downloadable from order detail page.

**Right column (sticky sidebar):**
5. **Billing Summary (auto-calculated, live-updating):**
   - Cost per unit (from Product Table)
   - Billable amount (from Fee Schedule Table)
   - Patient responsibility (calculated at 20% copay)
   - Company margin (calculated) — prominently displayed
   - Shows $0.00 when no line items added
6. **Additional Info** — Stripe payment link field, Notes textarea
7. **Form Validation** — Required fields (first name, last name, DOB, address), at least one line item, fee schedule match warnings
8. **Save as Draft** — Creates order with status "Draft" and empty status history

#### B. Document Auto-Generation (on order save)
1. **Encounter Form (PDF)** — Internal summary of the complete order. Auto-generated from order data. Employee downloads and uploads to patient record system as they do today.
2. **Patient Invoice (PDF)** — Calculated amounts + embedded Stripe payment link. Employee downloads and uploads to DocuSign for sending as they do today. Bridges to existing workflow — no DocuSign/Stripe integration needed.
3. **Proof of Delivery** — NOT in Sprint 1. Depends on delivery status tracking.

#### C. Admin: Reference Data Tables
1. **Product Table (CRUD)** — Product name, vendor, HCPCS code, cost, MSRP, category, requires measurement (Y/N), requires prior auth (Y/N)
2. **Fee Schedule Table (CRUD)** — Payer, HCPCS code, state, reimbursement rate, multipliers
3. **CSV Bulk Upload for Products** — Download standardized CSV template, upload populated file, preview/validate before import, flag error rows, bulk insert. Critical for onboarding — distributors carry hundreds of SKUs.
4. **CSV Bulk Upload for Fee Schedules** — Same template/upload/validate flow. Medicare publishes fee schedules as downloadable CSV files quarterly; this supports direct import of that data.

#### D. Order Dashboard
1. **Summary Cards** — Total Orders, Draft, In Progress, Delivered, Awaiting Approval (prior-auth orders pending manager review)
2. **Order List** — All orders in a searchable, filterable table
3. **Filters** — By status, by patient name search
4. **Order Detail View** — Click into any order to view full details + billing sidebar

#### E. Status Workflow (Linear Progression)
1. **Linear flow only** — Draft → Submitted → Approved → Ordered → Delivered (can only advance one step, no skipping)
2. **Contextual next-step button** — "Submit Order", "Approve Order", "Mark as Ordered", "Mark as Delivered"
3. **Status change dialog** — Captures actor name (typed, no login) and optional comment
4. **Manager approval gate** — Orders with prior-auth items show a distinct approval dialog at Submitted → Approved, listing flagged items for review, with Approve and Reject options
5. **Rejection handling** — Rejection records a comment in status history without changing status
6. **Activity timeline** — Order detail shows full status history: who, when, from → to, role (Employee/Manager), comments
7. **Re-download documents** — Access generated PDFs from order detail view

---

## What We Explicitly Do NOT Build in Sprint 1

| Feature | Why Not Yet | Target Sprint |
|---|---|---|
| DocuSign integration | Employee uploads PDF to DocuSign manually; works today | Sprint 2 |
| Stripe integration | Employee pastes link manually; low friction bridge | Sprint 2 |
| Proof of Delivery generation | Triggered by delivery event, not order creation | Sprint 2 |
| Role-based authentication / login | Alex's team is small and trust-based. Name-based actor tracking with activity timeline provides accountability without the engineering cost of auth (login, passwords, sessions, roles, protected routes). Auth becomes necessary as the team scales beyond ~15 people. | Sprint 3 |
| Automated vendor email dispatch | Needs vendor mapping + email templates | Sprint 3 |
| Measurement form parsing/validation | We store the file but don't extract data from it | Sprint 3+ |
| Insurance billing/claims submission | Outside core scope, complex payer integrations | Sprint 4+ |

---

## Key Scoping Decisions & Reasoning

### 1. Name-Based Tracking over Full Authentication
**Decision:** No login system in Sprint 1. Status changes capture the actor's typed name and role.
**Why:** Alex's team is small and trust-based — her current SharePoint approval has the same "anyone can click approve" dynamic. Adding auth (login, passwords, sessions, role assignment, protected routes) would consume ~30-40% of Sprint 1's engineering budget to protect against a problem that doesn't exist at their current team size. The activity timeline provides an audit trail with accountability. Auth becomes necessary when the team scales beyond ~15 people — that's Sprint 3.

### 2. CSV Bulk Upload over Manual Entry Only
**Decision:** Both products and fee schedules support CSV template download + bulk upload.
**Why:** A medical supply distributor carries hundreds of SKUs across multiple vendors. Manual entry is impractical for onboarding. Medicare publishes fee schedules as downloadable CSV files quarterly — the system should accept them directly.

### 3. Document Generation over Integration
**Decision:** Auto-generate encounter forms and invoices as downloadable documents. No DocuSign or Stripe API integration yet.
**Why:** The highest-value improvement is eliminating manual document assembly — the team currently builds these by hand from spreadsheet data. The existing DocuSign/Stripe workflow (upload PDF, create payment link) still works. Integration saves a few clicks per order; generation saves 15-20 minutes. Generation first, integration in Sprint 2.

### 4. Approval Gate over Full Workflow Engine
**Decision:** Prior-auth orders get a distinct approval dialog with manager name capture. No role-based enforcement.
**Why:** The approval step is qualitatively different from other status changes — it requires someone with authority to review and sign off. Making it visually and procedurally distinct (different dialog, item review, approve/reject) signals that this is a manager action. But enforcing it via roles requires auth infrastructure we deliberately deferred. The current approach mirrors SharePoint's trust-based model.

### 5. Measurement Form Upload over Parsing
**Decision:** Accept file uploads (PDF, JPG, PNG) per line item. No extraction or validation of form contents.
**Why:** Each vendor (Medi, Juzo, Solaris) has their own proprietary measurement form format. Parsing these would require vendor-specific templates and OCR — significant complexity for marginal value. The immediate need is simply: "attach the therapist's form to this order so we stop tracking it in email." Storage and retrieval is Sprint 1; intelligent processing is Sprint 3+.
| Analytics & reporting dashboard | Need real usage data first | Sprint 4 |

---

## Phased Roadmap

### Sprint 1 (Weeks 1-2) — Replace the Spreadsheet
**Why this first:** Everything downstream depends on reliable, structured order data. The spreadsheet is the #1 daily pain point — fragile formulas, hidden tables, no validation. Fix this and every other improvement has a foundation.

- Order entry form with auto-calculated billing (replaces Excel)
- Product & fee schedule admin tables with CSV bulk upload (replaces hidden lookup tables)
- Encounter form + patient invoice auto-generation (replaces manual document assembly)
- Measurement form upload per line item (unblocks ordering for custom garments)
- Order dashboard with search, filters, and status tracking
- Linear status workflow with manager approval gate for prior-auth items
- Activity timeline with actor name, role, and comments

### Sprint 2 (Weeks 3-4) — Document & Payment Integrations
**Why next:** With Sprint 1 live, the biggest remaining manual steps are uploading invoices to DocuSign and creating Stripe payment links. These are the highest-frequency repetitive tasks left — the team does them for every single order.

- DocuSign API — send patient invoice for signature directly from the app
- Stripe API — auto-generate payment links instead of manual creation
- Proof of Delivery generation + email to patient after delivery
- PDF export improvements (true PDF download vs. print-to-PDF)

### Sprint 3 (Weeks 5-6) — Workflow Automation & Access Control
**Why next:** Once documents and payments flow automatically, the remaining bottleneck is manual vendor ordering and the lack of enforced permissions. Alex mentioned her team re-enters order data into vendor portals — this sprint eliminates that entirely.

- User authentication + role-based access (employee vs. manager login)
- Automated vendor email dispatch — detect vendor from order, send order to correct email (e.g., Medi orders go to Medi's order inbox)
- Email notifications for status changes
- Prior authorization tracking enhancements

*Note: Sprint 4+ scope to be determined based on client feedback after Sprint 3 delivery. Potential areas include analytics/reporting, insurance billing integrations, and vendor portal API connections.*

---

## Tech Stack

- **Framework:** Next.js (React) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (client-side, in-memory — prototype uses seed data; production would use PostgreSQL)
- **Document Generation:** HTML templates rendered in new browser tab (printable)
- **Deployment:** Vercel (Hobby tier)
- **IDE:** Cursor (AI-assisted development)

**Prototype Note:** This is a clickable, deployable prototype. Data is client-side (resets on refresh). Production Sprint 1 would add PostgreSQL for persistence and cloud storage (e.g., S3/Vercel Blob) for file uploads. The UI and business logic remain the same.

**Live URL:** https://patient-beige.vercel.app

---

## Data Model (Core Entities)

### Product
- id, name, vendor, hcpcs_code, cost, msrp, category
- requires_measurement (boolean)
- requires_prior_auth (boolean)

### Fee Schedule
- id, payer, hcpcs_code, state, reimbursement_rate, multiplier

### Order
- id, status, created_at, updated_at
- patient_first_name, patient_middle_name, patient_last_name, patient_suffix
- patient_dob, patient_address, shipping_address
- insurance_payer, is_self_pay
- stripe_payment_link
- notes

### Order Line Item
- id, order_id, product_id
- quantity, unit_cost, billable_amount, patient_responsibility, margin
- requires_measurement_flag, requires_prior_auth_flag
- measurement_file (file reference — PDF/JPG/PNG, optional, for items requiring measurement)

### Generated Documents
- id, order_id, type (encounter_form | patient_invoice), generated_at, pdf_url

### Status Change (Activity Log)
- id, from_status, to_status, actor_name, actor_role (employee | manager), comment, timestamp
