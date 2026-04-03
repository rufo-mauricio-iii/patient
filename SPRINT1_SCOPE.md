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

#### A. Order Entry Form
1. **Patient Info** — First name, middle name, last name, suffix, DOB, address, shipping address, insurance/payer (dropdown), self-pay checkbox
2. **Product Selection** — Select from product dropdown (pulls from Product Table), each line item auto-fills: vendor, HCPCS code, cost. Quantity input. Self-pay → defaults to MSRP.
3. **Visual Flags** — "Measurement form required" indicator, "Prior auth required" indicator
4. **Measurement Form Upload** — Per line item file upload (PDF, JPG, PNG) for products flagged as requiring measurement. Therapist measurement forms are attached directly to the order line item. Viewable/downloadable from order detail page.
4. **Billing Summary (auto-calculated):**
   - Cost per unit (from Product Table)
   - Billable amount (from Fee Schedule Table)
   - Patient responsibility (calculated)
   - Company margin (calculated)
   - Total order value
5. **Stripe Payment Link Field** — Employee pastes their Stripe link, gets embedded in generated invoice
6. **Form Validation** — Required fields, valid product/payer combinations, immediate error feedback
7. **Save Order** — Creates order record with status "Draft"

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
1. **Order List** — All orders in a searchable, filterable table
2. **Filters** — By status, date, patient name
3. **Order Detail View** — Click into any order to view full details
4. **Status Tracking** — Draft → Submitted → Approved → Ordered → Delivered (manually updated in Sprint 1)
5. **Re-download documents** — Access generated PDFs from order detail view

---

## What We Explicitly Do NOT Build in Sprint 1

| Feature | Why Not Yet | Target Sprint |
|---|---|---|
| DocuSign integration | Existing workflow works; focus on data accuracy first | Sprint 2-3 |
| Stripe integration | Employee pastes link manually; low friction | Sprint 2-3 |
| Manager approval workflow | Needs role-based permissions; SharePoint still works | Sprint 3 |
| Automated vendor emails | Needs vendor mapping + templates; manual portal entry continues | Sprint 4 |
| Measurement form parsing/validation | We store the file but don't extract data from it | Sprint 2+ |
| Proof of Delivery generation | Triggered by delivery event, not order creation | Sprint 2 |
| Insurance billing/claims | Outside core scope | Sprint 4+ |

---

## Phased Roadmap

| Sprint | Theme | Key Deliverables |
|---|---|---|
| **Sprint 1** (Weeks 1-2) | Replace the Spreadsheet | Order form, auto-calculations, document generation, product/fee tables, order dashboard |
| **Sprint 2** (Weeks 3-4) | Complete the Document Lifecycle | POD generation, file uploads (measurement forms), PDF template refinement, bulk order view |
| **Sprint 3** (Weeks 5-6) | Workflow & Permissions | Manager approval flow, role-based access, order status automation, audit trail |
| **Sprint 4** (Weeks 7-8) | External Integrations | DocuSign API, Stripe API, automated vendor email dispatch |
| **Sprint 5** (Weeks 9-10) | Optimization & Intelligence | Analytics dashboard, prior auth automation, reporting, vendor portal integration |

---

## Tech Stack (for deployable prototype)

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** (Prototype: local state or JSON / Production: PostgreSQL)
- **PDF Generation:** HTML-to-PDF (e.g., react-pdf or similar)
- **Deployment:** Vercel
- **IDE:** Cursor (AI-assisted development)

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
