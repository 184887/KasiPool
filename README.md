# Kasipool

KASIPOOL WEB APPLICATION SPECIFICATION



1. Your Role and Overall Instructions



Act as a senior full-stack software engineer, product architect, UX/UI designer and business systems analyst.



Design and build a fully functional, mobile-first web application called KasiPool.



This is a Cape Town venture focused on collective purchasing for township businesses.



The application must be modern, professionally designed, easy to use, secure and built around a real collective purchasing business model.



Important instructions:



- Build a functioning web application, not just static mock-ups.

- Implement persistent database storage and working application logic.

- All primary buttons, forms, navigation elements and administrative functions must work.

- Prioritise simplicity, usability and the core pooling functionality.

- Make the customer interface exceptionally easy for people with limited digital literacy.

- Make the administrative interface functional and efficient.

- Use realistic South African business scenarios and product examples.

- Use verified business, supplier, offer and transaction information.

- Do not introduce unnecessary functionality outside the MVP.

- Where external providers or credentials are required, implement a properly labelled configuration step rather than pretending the integration works.

- Use sensible defaults where requirements are not fully specified.



The first version must support a complete end-to-end customer workflow, from joining a pool to collecting purchased goods.



---



2. Business Concept



What is KasiPool?



KasiPool is a managed collective purchasing platform that helps small Cape Town township businesses combine their purchasing demand to unlock better wholesale prices.



Many Cape Town township businesses purchase similar products independently, often in quantities too small to qualify for advantageous bulk prices.



KasiPool solves this by aggregating the quantities individual businesses want to purchase and negotiating collective deals with wholesalers.



Proposed tagline: Buy Together. Save More.



The business model



KasiPool operates as a managed collective purchasing platform.



It:



1. Identifies commonly purchased products.

2. Negotiates wholesale purchasing prices.

3. Publishes time-limited purchasing offers.

4. Allows interested businesses to join a purchasing pool.

5. Aggregates the quantities requested by participating businesses.

6. Closes a pool when the target quantity or deadline is reached.

7. Requests final order confirmation and payment.

8. Purchases stock from the wholesaler once sufficient paid demand has been secured.

9. Coordinates collection of the purchased products.

10. Records transactions, savings and operational performance.



Initially, KasiPool should operate without holding inventory before purchasing demand is confirmed and adequately funded.



For MVP design purposes, assume KasiPool resells products to participating businesses at an agreed customer price. Keep the financial model straightforward and avoid building complex accounting, tax or invoicing features before the commercial structure is finalised.



The core value proposition



For customers:



- Better purchasing power through collective demand.

- Potential access to lower prices.

- Transparent participation in a purchasing pool.

- No need to negotiate individually with wholesalers.

- Less individual purchasing effort.

- A simple process for purchasing and collecting goods.



For KasiPool:



- Aggregated purchasing demand.

- Wholesale negotiation leverage.

- Revenue through a managed purchasing margin.

- The ability to learn purchasing patterns.

- Opportunities to scale across products and locations.



The platform is not intended to be a conventional inventory-based e-commerce store.



Its defining functionality must be the collective purchasing and pooling mechanism.



---



3. Users and Access Roles



Create three principal access experiences.



3.1 Public Visitors



Visitors who are not logged in can:



- View the KasiPool homepage.

- Browse the product catalogue.

- View active purchasing offers.

- See public pool progress.

- Understand how KasiPool works.

- Register or log in.

- Share offers via WhatsApp.



Visitors must register before joining a pool.



3.2 Registered Business Customers



Registered customers can:



- Maintain their business profiles.

- Browse active offers.

- Select products and quantities.

- Join purchasing pools.

- View their active pool participations.

- Modify or withdraw interest while an offer remains open.

- Confirm orders when pools qualify.

- Access payment instructions.

- Track payment and order statuses.

- View collection instructions.

- Access previous orders and collection records.

- Receive in-app notifications.



A customer should only access information relating to their own business and orders.



3.3 KasiPool Administrators



Administrators can:



- Access an administration dashboard.

- Manage suppliers.

- Manage products and categories.

- Create and manage purchasing campaigns.

- Create and manage individual product pools.

- Configure purchasing targets, deadlines and prices.

- Monitor pooled demand.

- View participating businesses.

- Manage customer order confirmation.

- Record and verify payments.

- Generate consolidated supplier purchasing orders.

- Track supplier fulfilment.

- Allocate received stock.

- Manage customer collection.

- Record refunds and exceptions.

- View operational reports.

- Configure basic application settings.



Administration functions must be accessible only to authorised administrators.



There is no supplier login or supplier self-service portal in the MVP.



---



4. Visual Design and Branding



Create a distinctive, polished KasiPool visual identity.



The application should feel like a trustworthy modern South African commerce platform, combining the simplicity of a mobile shopping app with the excitement of a collective buying opportunity.



Suggested visual identity



Use the following colours as an initial proposal:



- Primary: Deep green (#116B45), representing growth, collective prosperity and trust.

- Secondary: Warm gold (#E9AC35), representing savings and opportunity.

- Background: Warm off-white (#F8FAF7).

- Primary text: Dark charcoal (#222B26).

- Supporting text: Muted grey.

- Success: Green.

- Warnings: Amber.

- Errors: Red.



The colour system should be easy to change when the final KasiPool brand identity is available.



Use a temporary wordmark reading KasiPool with a simple icon evoking multiple buyers joining into one collective.



Do not overuse decorative illustrations or stereotypical township imagery.



Design principles



- Mobile-first responsive design.

- Excellent usability on inexpensive Android smartphones.

- Fast-loading pages and optimised imagery.

- Large touch-friendly buttons.

- Clearly readable typography.

- Simple navigation.

- Minimal unnecessary text.

- Accessible contrast.

- Clear empty, loading, success and error states.

- A consistent design system.

- No cluttered dashboards.

- Professional desktop experience for administrators.



All customer-facing text should initially be in plain South African English.



Architect the interface so that additional languages can be introduced later.



Navigation



Suggested customer mobile navigation:



1. Home

2. Catalogue

3. Offers

4. My Pools

5. Profile



Use a bottom navigation bar on mobile and appropriate sidebar or header navigation on desktop.



The landing page must not feel like an enterprise software dashboard. It should feel like an inviting, easy-to-understand commerce application.



---



5. Customer Application Pages



5.1 Homepage



Design an engaging landing page containing:



Header



- KasiPool logo.

- Login/register access.

- Notifications icon for authenticated customers.

- Mobile-friendly navigation.



Hero section



Headline:



Buy Together. Save More.



Supporting copy:



"Join other local businesses to unlock better wholesale deals on the products you already buy."



Primary button:



Explore Active Offers



Secondary button:



How It Works



Active purchasing offers



Show attractive product cards containing:



- Product image.

- Product name.

- Packaging information.

- KasiPool offered price.

- Comparison price, when a valid reference is available.

- Potential savings.

- Pool progress indicator.

- Closing date and time.

- Pool status.

- Join Pool button.



How KasiPool works



Show a simple four-step explanation:



1. Find a deal.

2. Join the pool.

3. Confirm and pay once the deal qualifies.

4. Collect your stock.



Use simple icons and short descriptions.



Additional sections



- Featured products.

- Offers closing soon.

- A brief explanation of collective purchasing.

- Call to action for new businesses.

- Footer with contact information, privacy notice and terms.



Do not invent customer testimonials or claim that fictional customers have saved money.



5.2 Product Catalogue



Build a searchable product catalogue.



Each product should have:



- Product ID/SKU.

- Product name.

- Category.

- Image.

- Brand, where applicable.

- Product description.

- Standard purchasing unit.

- Pack size.

- Active/inactive status.



Suggested initial categories:



- Cooking Oil

- Rice

- Sugar

- Maize Meal

- Flour

- Beverages

- Cleaning Products

- Other Groceries



A product may appear in the catalogue without having a currently active purchasing offer.



If the product has an active offer, display a clear View Active Pool button.



If no pool is active, display No Active Offer rather than a misleading Buy Now button.



Support product searching and category filtering.



Do not build advanced stock management or a conventional shopping basket.



5.3 Active Offers Page



Display all currently available purchasing campaigns and product pools.



Allow users to:



- Search offers.

- Filter by category.

- Sort by closing time.

- Sort by progress towards target.

- Filter by status.

- Open an offer.

- Share an offer.



The interface should emphasise products, potential savings and current pool progress.



5.4 Offer Details Page



This is one of the most important screens in the application.



Design an attractive page with:



Product details



- Large product image.

- Product name.

- Brand.

- Description.

- Packaging size.

- Unit of purchase.



Example:



Sunflower Cooking Oil, 2L Bottles, Carton of 6.



Pricing



Display:



- KasiPool price per purchasing unit.

- Reference price, when verified.

- Potential saving in rand.

- Potential saving percentage.

- An indication of whether collection or other fees apply.



For example:



Reference price: R240



KasiPool price: R219



Potential saving: R21 per carton (8.75%)



Reference prices must be supported by an administrator-entered source and date. If no credible comparison is available, do not show a savings claim.



Pool progress



Create a large, visually prominent progress section showing:



- Minimum purchasing target.

- Quantity currently pledged.

- Percentage achieved.

- Remaining quantity.

- Number of participating businesses.

- Closing date and time.



Example:



45 of 60 cartons pledged



75% of target reached.



12 participating businesses.



Make the progress bar visually appealing and animate changes subtly.



Display a countdown timer while the pool is open, using the correct South African time zone.



Quantity selection



Include a quantity stepper with plus and minus controls.



The customer should be able to:



- Increase the quantity.

- Decrease the quantity.

- See the calculated potential order value.

- Join the pool.



Example:



Quantity: 3 cartons.



Price per carton: R219.



Potential order value: R657.



Primary CTA:



Join This Pool



Collection information



Show:



- Collection point.

- General location.

- Expected collection arrangements.

- Any applicable fees.



Do not promise a collection date until the operational schedule is confirmed.



Purchase conditions



Explain:



- Joining initially indicates interest.

- No payment is required at this stage.

- Payment is requested only if the pool qualifies.

- The offer is subject to its stated terms and supplier availability.



5.5 Join Pool Interaction



When a customer clicks Join This Pool:



1. Check whether they are authenticated.

2. If not authenticated, direct them to login/registration.

3. Preserve the offer they were viewing.

4. Return them to the offer after authentication.

5. Validate the quantity.

6. Save their interest to the database.

7. Update the pool's aggregate quantity.

8. Display a success confirmation.



Example message:



You've joined the pool!



"You've registered interest in 3 cartons of sunflower cooking oil."



"We'll let you know when the pool qualifies and it's time to confirm your order."



Buttons:



- View My Pools.

- Browse More Offers.



A customer should not be able to accidentally create multiple duplicate entries for the same product pool.



Instead, if they have already joined, allow them to update their existing quantity while the pool is open.



5.6 My Pools Page



Create a personal dashboard for each registered business.



Show:



Active Pool Participations



Each participation should display:



- Product image.

- Product name.

- Requested quantity.

- Offered unit price.

- Estimated total.

- Current pool progress.

- Pool status.

- Closing date.

- Next required action.



Awaiting Action



Clearly highlight instances where the customer must:



- Confirm an order.

- Make payment.

- Resolve a payment issue.

- Collect purchased goods.



Completed and Previous Orders



Display previous orders with:



- Order reference.

- Product.

- Quantity.

- Total paid.

- Order status.

- Collection date, where applicable.



Use simple status labels and avoid exposing internal technical terminology.



5.7 Order Confirmation Page



When the pool qualifies, participating customers must be able to confirm the purchase.



Show an order summary:



- Product name.

- Quantity requested.

- Final unit price.

- Order total.

- Collection arrangements.

- Payment deadline.

- Purchasing conditions.



The customer must explicitly confirm the order.



Include a required acknowledgement of the applicable terms.



Buttons:



Confirm My Order



Decline



Confirmation must record the agreed quantity, unit price, amount, terms version and timestamp.



An order should not be silently altered after the customer confirms it.



5.8 Payment Instructions Page



After confirmation, display:



- Order number.

- Amount payable.

- Payment deadline.

- Approved payment method.

- Unique payment reference.

- Payment status.



MVP payment statuses:



- Awaiting Payment

- Payment Under Review

- Paid

- Payment Issue

- Expired

- Refunded



For the first version, implement manually verified payment tracking through the administrator dashboard.



Allow administrators to configure legitimate business payment instructions.



Never invent actual bank account details.



When no payment method has been configured, show an explicit message that payment instructions are not yet available and prevent the order from being represented as ready for payment.



Do not allow customers to mark their own orders as paid.



Do not regard a payment screenshot as conclusive verification.



The architecture should support adding a recognised payment gateway in a later phase.



Do not implement stored-value wallets or custom escrow functionality.



5.9 Order Tracking Page



Design a clear status timeline.



Example:



Interest Registered → Pool Qualified → Order Confirmed → Payment Verified → Stock Ordered → Stock Ready → Collected.



Show the current step prominently.



Provide any next action required.



If an order fails, clearly show the reason and the refund process where applicable.



5.10 Business Profile



Registration should collect:



- Business/trading name.

- Owner or representative name.

- Mobile number.

- Email address, when available.

- Business category.

- Township/suburb.

- City.

- Province.

- Optional trading address.

- Acceptance of the applicable terms and privacy notice.



Make registration lightweight.



Mobile number login with one-time passwords is the preferred eventual experience.



Use Supabase authentication. If SMS authentication requires an external provider that has not been configured, implement a genuinely working supported authentication alternative for the initial release, while preserving mobile number as a required business contact field.



Do not simulate successful SMS verification.



Initial registration should associate one customer account with one business profile. Support for multiple businesses per user can be added later.



---



6. Purchasing Campaigns and Product Pools



The platform must distinguish between a purchasing campaign and an individual product pool.



Purchasing Campaign



A campaign groups related products under one promotional theme.



Example:



October Spaza Essentials



This campaign contains:



- Cooking oil.

- Sugar.

- Rice.

- Maize meal.



Product Pool



Each product pool has its own purchasing target, pricing, participation and outcome.



For example:



Cooking Oil: 45/60 cartons.



Sugar: 70/100 bags.



Rice: 32/40 bags.



The individual progress indicators must be independent.



A campaign may contain several product pools, but one product reaching its target must not automatically mark the other products as successful.



A customer may join several product pools independently.



For this MVP, avoid a complicated multi-product checkout. Every product pool can result in a separate confirmed order.



---



7. Pool Management Business Logic



Implement the following lifecycle.



Stage 1: Draft



The administrator creates a pool and configures:



- Product.

- Supplier.

- Purchasing unit.

- Supplier cost.

- Customer selling price.

- Reference price and source, if available.

- Minimum purchasing quantity.

- Optional maximum quantity.

- Opening date.

- Closing date.

- Collection point.

- Expected supplier fulfilment information.

- Payment confirmation window.

- Customer quantity limits where relevant.



The administrator can save drafts and edit them.



Stage 2: Open



After publication:



- The pool becomes publicly visible.

- Customers can register interest.

- Requested quantities are aggregated.

- The progress bar updates.

- Customers can edit or withdraw interest.



Protect the quantities against race conditions and enforce any maximum limits.



Stage 3: Pool Closure



The MVP should close a pool when the purchasing target is reached or the offer deadline expires, whichever happens first.



When the closing condition is reached:



If the minimum quantity has been reached:



- Close the pool to new interest.

- Set status to Qualified: Awaiting Confirmation.

- Notify participating customers inside the app.

- Open the order confirmation process.



If the minimum has not been reached:



- Set status to Unsuccessful.

- Notify participating customers.

- Do not request payment.

- Do not create a supplier purchasing order.



A failed pool can be relaunched as a new offer, but customer commitments must not be automatically transferred.



Closing rules must operate correctly on the backend even when no customer has the page open.



Stage 4: Customer Confirmation



Customers review and confirm their final orders.



Allow customers to decline.



Set a configurable confirmation/payment deadline, with 24 hours as the initial default.



All times must be handled in Africa/Johannesburg time.



Stage 5: Payment



Track customer payments separately from expressions of interest.



The system must distinguish:



- Interested quantity.

- Confirmed quantity.

- Fully paid quantity.



The administrator verifies payments against actual transaction evidence from the business's approved payment channel.



Stage 6: Funding Decision



A pool is considered funded only when fully paid quantities meet or exceed the supplier's minimum viable purchasing requirement.



For example:



60 cartons required.



75 cartons originally pledged.



65 cartons confirmed.



62 cartons fully paid.



The funded quantity is 62 cartons.



The supplier order should cover the fully paid and accepted quantities, not all 75 originally pledged.



If the minimum is not funded by the deadline, flag the pool for failure and resolution. Do not automatically place the supplier order.



Any funds already received must be tracked for appropriate refund processing.



Stage 7: Supplier Procurement



An administrator reviews and authorises the consolidated purchase order.



The application must not automatically purchase stock from suppliers.



The purchase order should contain:



- Supplier.

- Product.

- Purchasing unit.

- Paid customer quantity to fulfil.

- Total quantity required.

- Agreed supplier unit cost.

- Total estimated supplier cost.

- Supplier order reference.

- Purchase order status.



Stage 8: Fulfilment



Administrators record:



- Stock ordered.

- Stock received.

- Quantity received.

- Stock discrepancies.

- Stock allocated.

- Stock ready for collection.



Only quantities supported by received stock may be marked ready for collection.



Stage 9: Collection



Customers receive a unique collection reference.



Administrators can:



- Search an order.

- Verify its collection reference.

- View allocated products.

- Mark the order as collected.

- Record collection date and time.

- Record the administrator who authorised collection.



Prevent accidental duplicate collection records.



Stage 10: Completion



The system marks a pool as completed when its relevant paid orders are fully resolved.



Retain a transaction history and basic operational performance information.



---



8. Administrative Dashboard



Build a professional, desktop-friendly administrative interface that also works on mobile.



Dashboard Summary



Display:



- Number of active pools.

- Registered businesses.

- Active participating businesses.

- Pools awaiting confirmation.

- Pools awaiting funding.

- Funded pools awaiting procurement.

- Outstanding customer payments.

- Orders awaiting collection.

- Completed orders.

- Total paid order value.

- Estimated gross purchasing spread.



Clearly label monetary figures so revenue, gross spread and profit are not confused.



Operational Work Queue



Create a prominent action panel showing items that require attention.



Examples:



- 3 pools have reached their targets.

- 12 orders are awaiting payment verification.

- 1 funded pool needs supplier procurement.

- 2 products are awaiting stock receipt.

- 7 customer orders are ready for collection.



Each item should open the relevant management screen.



---



9. Administration Modules



9.1 Supplier Management



Administrators can create and edit supplier records.



Fields:



- Supplier name.

- Contact person.

- Mobile number.

- Email.

- Business location.

- Product categories.

- Notes.

- Active/inactive status.



Supplier information and wholesale purchasing costs must not be publicly visible.



9.2 Product Management



Administrators can:



- Create products.

- Edit product information.

- Upload images.

- Assign categories.

- Define purchasing units and packaging.

- Activate/deactivate products.

- Associate products with pools.



Use a searchable table with filters.



9.3 Campaign and Pool Management



Create a user-friendly form or wizard that allows administrators to:



1. Create a campaign.

2. Select products.

3. Configure individual product pools.

4. Assign suppliers.

5. Enter supplier and customer pricing.

6. Set minimum quantities.

7. Set opening and closing dates.

8. Assign collection arrangements.

9. Review and publish.



After publication, lock key commercial fields such as offered price and purchasing unit. Material changes should require cancellation and a revised offer rather than silently changing customer terms.



9.4 Participation Management



Provide a detailed view of each pool.



Include:



- Registered participants.

- Business name.

- Quantity requested.

- Participation date.

- Confirmation status.

- Payment status.

- Aggregate quantities.



Administrators must be able to filter by status.



Customers must never see each other's personal details or individual purchasing quantities.



9.5 Payment Management



Create a payment reconciliation table.



Columns:



- Order reference.

- Customer.

- Product.

- Amount due.

- Payment reference.

- Amount verified.

- Payment status.

- Verification date.



Administrators should be able to:



- Find orders.

- Record an externally verified payment.

- Record partial or mismatched payments for review.

- Mark full payments as verified.

- Record payment issues.

- Track refund obligations.

- Record completed refunds.

- See a history of changes.



Payment verification and refund actions must be restricted to authorised administrators and recorded in an audit log.



Never treat a customer-uploaded proof of payment alone as verified settlement.



9.6 Procurement Management



Generate consolidated supplier order records from funded pools.



Allow administrators to record:



- Supplier order date.

- Supplier reference.

- Purchasing quantity.

- Agreed unit cost.

- Expected delivery date.

- Procurement status.



Do not implement automated wholesaler API purchasing during the MVP.



9.7 Collection Management



Build a simple operational screen that staff can use at a collection point.



Capabilities:



- Search by order number.

- Search by customer business.

- Verify collection code.

- Display products and quantities.

- Confirm release of goods.

- Record collection timestamp.

- Display already-collected status.



9.8 Customer Management



Show:



- Registered businesses.

- Contact information.

- Business location.

- Pools joined.

- Orders placed.

- Payment statuses.

- Collection history.



Allow administrators to search and filter.



9.9 Reporting



Implement a small set of useful operational reports:



- Pools created.

- Pools successfully funded.

- Pools unsuccessful.

- Interest-to-confirmation conversion.

- Interest-to-payment conversion.

- Purchasing volume.

- Gross order value.

- Gross purchasing spread.

- Order fulfilment.

- Repeat customers.



Avoid complex business intelligence or AI forecasting in the initial version.



---



10. Notifications and WhatsApp



Implement an in-app notification system.



Events should include:



- Customer joins a pool.

- Pool qualifies.

- Customer confirmation required.

- Payment required.

- Payment verified.

- Order processing.

- Stock ready for collection.

- Pool unsuccessful.

- Order completed.



Include an unread notification count.



WhatsApp Sharing



Add a Share via WhatsApp button to offer pages.



It should generate a message containing:



- Product.

- Offered price.

- Potential savings if verified.

- Pool closing date.

- Link to the offer.



Example:



"Join the KasiPool cooking oil deal! Pool with other local businesses to get a better bulk price. View the offer: [link]"



Use actual offer deep links.



WhatsApp Automation



Do not build a WhatsApp chatbot or complex automated messaging integration during the MVP.



Provide a clean structure for adding WhatsApp Business messaging later.



Any future marketing messages must respect customer opt-in preferences.



---



11. Database and Backend Requirements



Use Supabase for the database, authentication and storage, with secure server-side functions where required.



Build a properly structured relational data model.



Suggested entities:



1. User Profiles: User ID, role, contact and account status.

2. Businesses: Trading name, representative, location and contact details.

3. Products: Catalogue information and packaging.

4. Categories: Product categories.

5. Suppliers: Private supplier records.

6. Campaigns: Grouped promotional offers.

7. Product Pools: Targets, prices, timelines, suppliers and statuses.

8. Pool Participations: Customer expressions of interest and quantities.

9. Orders: Confirmed customer purchases with frozen pricing.

10. Payments: Payment amounts, references and verification records.

11. Supplier Purchase Orders: Consolidated procurement.

12. Collection Points: Pickup locations.

13. Collections: Allocations, collection references and receipt records.

14. Notifications: Customer messages and read status.

15. Refunds and Exceptions: Unsuccessful orders and resolutions.

16. Audit Events: Important administrative changes.

17. Application Settings: Configurable operational parameters.



Use suitable primary keys, relationships, constraints and indexes.



Important backend rules



- Customers can access only their own private data.

- Published offer information can be accessed publicly.

- Supplier costs are administrator-only.

- Customer records are administrator-only except for the customer's own record.

- Administrator privileges must be enforced on the backend, not just by hiding interface buttons.

- Users cannot grant themselves administrator rights.

- Pricing, quantity validation and pool closure logic must be enforced server-side.

- Critical state transitions must be validated.

- Prevent duplicate paid orders and duplicated collection.

- Preserve historical order prices.

- Keep an audit trail for financial and fulfilment actions.

- Use appropriate row-level security policies.

- Keep secrets and integration credentials out of frontend code.



Prefer reliable, maintainable implementation over unnecessary architectural complexity.



---



12. Currency, Time and Localisation



KasiPool is launching in Cape Town townships, including Khayelitsha, Gugulethu, Langa, Nyanga, Philippi, Delft, Mitchells Plain, Crossroads, Manenberg and Bonteheuwel.



Apply these conventions:



- Currency: South African rand (ZAR).

- Currency symbol: R.

- Time zone: Africa/Johannesburg (SAST).

- Date format: DD MMM YYYY.

- Mobile numbers: Support South African number formats, including +27.

- Default language: English.

- Geographic focus: Cape Town townships, including Khayelitsha, Gugulethu, Langa, Nyanga, Philippi, Delft, Mitchells Plain, Crossroads, Manenberg and Bonteheuwel.



Use consistent money formatting throughout the application.



Example:



R1 250.00



The pricing model must distinguish supplier cost, customer selling price, reference price and applicable fees.



Do not present estimated gross purchasing spread as net profit.



---



13. Pool Status System



Create a clear status model.



Suggested internal statuses:



- Draft

- Scheduled

- Open

- Qualified

- Awaiting Confirmation

- Awaiting Payment

- Funded

- Procurement in Progress

- Stock Received

- Ready for Collection

- Completed

- Unsuccessful

- Cancelled

- Refund Resolution Required



Not every internal status should be shown verbatim to customers.



Map them to clear customer-facing labels.



For example:



- Open for Pooling

- Target Reached

- Confirm Your Order

- Payment Due

- Payment Confirmed

- Preparing Your Stock

- Ready for Collection

- Completed

- Offer Unsuccessful



Design a consistent set of status badges and tracking indicators.



Keep interest, confirmed orders, payment records, procurement and collection states logically separate rather than forcing all information into a single status field.



---



14. Initial Reference Data



Seed only non-transactional reference values such as product categories. Administrators must create commercial records through the application using verified supplier, customer, product, pricing and fulfilment information. Keep the catalogue and offer lists empty until legitimate records are configured.



---



15. Authentication and Roles



Create functional registration, login and logout.



Support at least:



- Public visitor.

- Registered business customer.

- KasiPool administrator.



Create a secure way for the project owner to initialise the first administrator account without publishing administrator credentials or allowing public self-promotion to admin.



Use real authentication and role-based authorisation, not merely a frontend dropdown pretending to change permissions.



---



16. Important UX Components



Create reusable components for:



- Product cards.

- Campaign cards.

- Pool progress bars.

- Countdown timers.

- Status badges.

- Quantity selectors.

- Order summaries.

- Payment status panels.

- Order tracking timelines.

- Confirmation dialogs.

- Toast notifications.

- Search/filter controls.

- Admin data tables.

- Dashboard metric cards.

- Mobile navigation.

- Empty states.

- Loading states.

- Error messages.



Particular attention: Pool Progress



The pooling progress indicator is KasiPool's signature feature.



It should convey a sense of collective achievement.



The interface should visually communicate:



"Several businesses are joining forces to unlock this deal."



Show both:



- Number of participating businesses.

- Total quantity committed.



Use subtle visual feedback when the target is reached.



However, do not confuse pledged interest with confirmed payment.



The application must clearly distinguish:



Interest target reached from order fully funded.



---



17. Critical User Flows to Implement and Test



Customer Flow A: Joining a Pool



1. Visitor opens homepage.

2. Visitor browses active offers.

3. Visitor selects cooking oil.

4. Visitor sees price, progress and closing date.

5. Visitor chooses three cartons.

6. Visitor clicks Join Pool.

7. Visitor logs in or registers.

8. System saves participation.

9. Pool totals update.

10. Customer sees confirmation.

11. Participation appears in My Pools.



Customer Flow B: Confirming and Paying



1. Pool reaches minimum quantity.

2. System closes interest registration.

3. Customer receives in-app notification.

4. Customer opens order confirmation.

5. Customer reviews quantity and price.

6. Customer confirms or declines.

7. If confirmed, system creates a unique order reference.

8. Customer receives payment instructions.

9. Administrator verifies the payment.

10. Customer sees Payment Confirmed.



Administrator Flow C: Creating an Offer



1. Administrator logs in.

2. Opens product/pool management.

3. Creates a campaign.

4. Selects a product.

5. Assigns supplier.

6. Sets price and target quantity.

7. Sets dates and collection arrangement.

8. Previews the offer.

9. Publishes.

10. Offer becomes publicly visible.



Administrator Flow D: Procuring Stock



1. Pool has sufficient verified paid demand.

2. Administrator opens the funded pool.

3. Reviews paid quantities.

4. Generates a supplier purchase order.

5. Records supplier order reference.

6. Marks procurement in progress.

7. Records received stock.

8. Allocates received quantities to customer orders.

9. Marks allocated orders ready for collection.



Customer and Administrator Flow E: Collection



1. Customer receives collection notification.

2. Customer views collection reference.

3. Customer arrives at designated collection point.

4. Administrator searches the order.

5. Administrator validates reference and allocation.

6. Administrator hands over the correct products.

7. Administrator marks the order collected.

8. Customer sees Completed in their account.



Failure Flow F: Unsuccessful Pool



1. Pool closes below minimum quantity.

2. Status changes to Unsuccessful.

3. Customer receives notification.

4. No payment is requested.

5. Administrator may create a new offer.



Failure Flow G: Insufficient Payment



1. Interest target was achieved.

2. Customers confirm orders.

3. The payment deadline passes.

4. Fully paid quantities remain below minimum.

5. No supplier order is automatically created.

6. Administrator resolves the failed pool.

7. Any payments received are tracked for refund handling.



Every flow should work with persistent application data.



---



18. Features Explicitly Excluded from MVP



Do not implement:



- Supplier self-service accounts.

- Customer-created private purchasing groups.

- Social-network features.

- Product reviews and ratings.

- Dynamic AI-driven pricing.

- AI purchasing forecasts.

- Automated wholesale supplier integrations.

- Advanced delivery logistics.

- Individual home deliveries.

- Driver applications.

- Credit purchasing.

- Buy-now-pay-later.

- Stored-value wallets.

- Cryptocurrency.

- Loyalty points.

- Referral rewards.

- Complex accounting integrations.

- Multi-business corporate account structures.

- Automated tax invoicing.

- Full WhatsApp chatbot.

- Native Android/iOS applications.



Focus on the working collective purchasing process.



The codebase should remain extensible for future capabilities without building them now.



---



19. Quality, Security and Reliability



Implement:



- Input validation.

- Safe error handling.

- Role-based permissions.

- Secure database access.

- Appropriate row-level security.

- Server-side validation of commercial actions.

- Transaction-safe quantity updates.

- Prevention of duplicate participation and collection.

- Responsive layouts.

- Accessible forms.

- Clear user feedback.

- Secure management of user data.

- Reliable date and time handling.

- Audit logs for financial changes.

- Graceful handling of unavailable external integrations.



Provide draft Terms, Privacy and Help pages, clearly identified as content requiring legal and operational review before launch.



Avoid collecting unnecessary personal information.



Use privacy-by-design principles and allow customers to manage their communication preferences.



---



20. Development Priorities



Build the application in the following logical sequence.



Phase 1: Foundation and Customer Experience



- Brand and design system.

- Responsive layout.

- Database structure.

- Authentication and roles.

- Homepage.

- Product catalogue.

- Active offers.

- Offer details.

- Business registration.



Phase 2: Pooling Functionality



- Join pool.

- Update/withdraw interest.

- Quantity aggregation.

- Progress indicators.

- Deadline handling.

- Pool qualification and closure.

- My Pools.



Phase 3: Order and Payment Lifecycle



- Customer confirmation.

- Unique order references.

- Payment instructions.

- Administrative payment verification.

- Funding thresholds.

- Failed-order handling.



Phase 4: Administration and Fulfilment



- Supplier management.

- Campaign management.

- Pool management.

- Customer management.

- Procurement order records.

- Stock receipt.

- Customer allocation.

- Collection processing.

- Operational dashboard.



Phase 5: Verification



- Test customer journeys.

- Test administrator journeys.

- Test role permissions.

- Test failures and exceptions.

- Validate totals and calculations.

- Fix broken interactions.

- Check mobile responsiveness.



Prioritise completing a reliable vertical slice of the core purchasing journey over creating many unfinished features.



If implementing all functionality requires multiple build steps, retain this specification as the product baseline and implement it in the priority order above.



---



21. Acceptance Criteria



The MVP should not be considered complete until the following are demonstrated:



1. A visitor can browse active offers without logging in.

2. A business customer can register and log in.

3. An administrator can create a product and publish a pool.

4. A customer can select a quantity and join the pool.

5. Participation is saved permanently in the database.

6. Multiple customers' quantities aggregate correctly.

7. A customer can modify interest while the pool remains open.

8. The system correctly closes a pool when the target or deadline is reached.

9. An unsuccessful pool does not incorrectly proceed to payment.

10. A qualified pool allows final customer confirmation.

11. A confirmed order has a unique reference and fixed price.

12. Administrators can record verified payments.

13. The system distinguishes pledged, confirmed and paid quantities.

14. A pool below the paid purchasing threshold cannot automatically proceed to procurement.

15. An administrator can generate a supplier order from funded demand.

16. An administrator can record receipt and allocate stock.

17. A customer can view collection instructions.

18. An administrator can verify and complete a collection.

19. Customers cannot access other customers' private records.

20. The app works well on mobile and desktop.



All these functions must be genuinely implemented rather than simulated through hard-coded screen transitions.



---



22. Final Build Instructions



Please now create the KasiPool web application.



Use the business concept, customer journeys, screens, administrative requirements and business rules in this specification.



Start with a well-designed, mobile-first application that makes collective purchasing visually obvious.



Use Supabase for the persistent backend, database and authentication.



Create functional customer and administrator interfaces connected to the same underlying data.



Allow authorised administrators to configure the catalogue with verified South African products.



Use a clean, maintainable architecture and reusable components.



Prioritise:



1. The pooling experience.



2. Trust and transparency.



3. Clear customer order progression.



4. Practical administrative control.



5. Simple and reliable functionality.



After implementation, test the principal customer and administrator workflows and report which functions are complete, which require configuration and which remain outside the MVP.



The application should support several Cape Town township businesses combining demand, achieving a viable collective purchase, paying individually and collecting products coordinated by KasiPool.



This is the essence of the business model, and it must be clearly reflected in the functioning web application.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Provider credentials and webhook setup are documented in
[docs/third-party-provider-setup.md](./docs/third-party-provider-setup.md).
