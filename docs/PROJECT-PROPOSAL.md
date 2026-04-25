# TransitPH: Philippine Public Transport Navigator

## 1. Introduction

[cite_start]TransitPH is a web-based public transport navigation platform designed specifically for the Philippine transport ecosystem[cite: 3, 67]. [cite_start]Despite the scale of public utility vehicles (PUVs), the network remains one of the least digitally documented in Southeast Asia[cite: 11]. [cite_start]In metropolitan areas like **Naga City**, the lack of centralized, real-time guides forces commuters to rely on informal word-of-mouth directions[cite: 12]. [cite_start]TransitPH addresses this information gap by providing an intelligent routing assistant for affordable transport options[cite: 68, 70].

---

## 2. Core System Features

[cite_start]The application focuses on empowering users to navigate independently by providing two primary functions[cite: 70]:

### 2.1 Transportation Route Finding

[cite_start]The system serves as an intelligent routing assistant that accepts a user’s origin and destination to return optimized travel routes[cite: 68, 81].

- [cite_start]**Intermodal Routing**: Supports paths combining **jeepney** legs, **tricycle** terminal points, and **walking** segments[cite: 83, 137].
- [cite_start]**Preference Filters**: Users can refine results to prioritize the fastest route or limit suggestions to specific modes like "Jeepney-only"[cite: 88, 139].
- [cite_start]**Step-by-Step Guidance**: Displays sequential boarding and alighting points, including landmark cues to assist travelers unfamiliar with local geography[cite: 84, 119].

### 2.2 Automatic Fare Computation

[cite_start]To address the affordability gap in urban mobility, the system provides transparent financial information for every trip[cite: 39, 138].

- [cite_start]**Estimated Fare Calculation**: Calculates costs for each vehicle leg based on the applicable **LTFRB fare matrix**[cite: 93, 138].
- [cite_start]**Total Trip Aggregation**: Provides a prominent total cost estimate for the entire journey, allowing users to compare routes based on budget[cite: 89, 94].
- [cite_start]**Dynamic Updates**: Estimates are updated within the system when government-regulated fare adjustments are applied[cite: 95].

---

## 3. Administrative Management

[cite_start]While the platform is accessible to guest users without accounts, a secure administrative interface is maintained to ensure data integrity[cite: 150, 156, 167].

- [cite_start]**Route Data Management**: Administrators update route information, fare matrices, and the associations between different transport lines[cite: 215].
- [cite_start]**Station Registry**: A moderated database of registered stations and their locations, with CRUD (Create, Read, Update, Delete) operations restricted to authorized personnel[cite: 164, 212].
- [cite_start]**System Integrity**: A role-based dashboard provides an audit trail for all content changes and data updates[cite: 107, 144].

---

## 4. Technical Architecture

[cite_start]The project utilizes a modern web stack to ensure performance on low-specification devices and varying mobile data speeds[cite: 145].

| Layer        | Technology          | Rationale                                                                                                              |
| :----------- | :------------------ | :--------------------------------------------------------------------------------------------------------------------- |
| **Frontend** | **Next.js 14+**     | [cite_start]Enables performant, SEO-friendly pages and server-side rendering[cite: 198].                               |
| **Styling**  | **Tailwind CSS**    | [cite_start]Accelerates UI development with utility-first styling for design consistency[cite: 198].                   |
| **Backend**  | **Django (Python)** | [cite_start]A secure, "batteries-included" framework with a powerful ORM and built-in admin panel[cite: 198, 219].     |
| **Database** | **PostgreSQL**      | [cite_start]Supports complex geospatial queries via the **PostGIS** extension for location-based data[cite: 200, 222]. |

---

## 5. Scope and Limitations

- [cite_start]**Modes of Transport**: The scope is limited to **Jeepneys**, **Tricycles** (from terminal points), and **Walking**[cite: 83, 182].
- [cite_start]**Real-Time Data**: The system does not provide live GPS tracking of vehicles; routes are based on fixed, scheduled paths[cite: 175, 176].
- [cite_start]**Payments**: The platform is informational only and does not process fare payments or ticketing[cite: 177, 178].
- [cite_start]**Connectivity**: An active internet connection is required, as offline caching is not supported in the current version[cite: 191].
