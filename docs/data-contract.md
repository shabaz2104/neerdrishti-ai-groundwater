# NeerDrishti Groundwater Data Contract

## 1. Purpose

This document defines the groundwater data contract for NeerDrishti as it is currently understood from the SRS. It is intended to describe the application-level record model for groundwater information used by the project without creating database tables, migrations, or fabricated data values.

The SRS is the authoritative source for this ticket. When a detail is not specified, it is marked as UNKNOWN or TBD rather than assumed.

## 2. SRS-supported concepts

The following concepts are explicitly supported by the SRS and must be treated as core application requirements:

- Maharashtra
- district
- block
- year
- groundwater data
- recharge
- extraction
- groundwater classification
- historical records

The following are not to be added as required fields or hierarchy levels unless the actual dataset proves they are required:
- taluka
- village
- watershed
- basin
- latitude
- longitude
- other geographic levels beyond district and block

## 3. Proposed logical groundwater record

The initial logical groundwater record must be kept intentionally conservative. It reflects only the concepts explicitly supported by the SRS and avoids inventing unsupported measurements.

### Logical record fields

| Field | Meaning | Expected data type | Required | SRS status | Exact dataset representation |
|---|---|---|---|---|---|
| district | District containing the groundwater assessment unit | string | yes | SRS-supported | Unknown until actual dataset is available |
| block | Block-level groundwater assessment unit | string | yes | SRS-supported | Unknown until actual dataset is available |
| year | Assessment year | integer | yes | SRS-supported | Exact column name and source format are unknown |
| recharge | Groundwater recharge measurement | numeric | if present | SRS-supported | Exact column name, units, and source representation are unknown |
| extraction | Groundwater extraction measurement | numeric | if present | SRS-supported | Exact column name, units, and source representation are unknown |
| classification | Groundwater classification result | string | if present | SRS-supported | Exact category vocabulary is TBD and depends on official dataset/standard |

### Additional notes

- The SRS does not specify units for recharge or extraction. Units remain UNKNOWN until the real dataset is reviewed.
- The SRS requires groundwater classification, but it does not provide the complete classification vocabulary. The authoritative classification list is therefore TBD.
- The application should support the concept of historical groundwater records across several years, but the precise year coverage must be validated against the actual source dataset.

## 4. Geographic hierarchy

The expected hierarchy is as follows:

```text
Maharashtra
  └── District
       └── Block
            └── Year
                 └── Groundwater assessment
```

This hierarchy reflects the SRS as stated. No additional geographic levels are introduced in this document unless the source dataset requires them.

## 5. Time scope

- Initial target period: 2015–2024
- Year should be represented as a numeric year value
- Exact availability and completeness must be verified against the real dataset
- No records should be fabricated for missing years

The application must not assume that all years in the range are present. The actual dataset will determine availability.

## 6. Classification

Groundwater classification is required by the SRS, but the available classification taxonomy is not given in the repository or the SRS details provided here.

Therefore:
- the application must support groundwater classification as a first-class concept
- the authoritative classification vocabulary is TBD
- the application should be designed so the classification vocabulary can be matched to the source dataset or official groundwater classification standard when the dataset is available
- the complete enumeration of classification values must not be invented in this ticket

## 7. Units

Measurement units for recharge and extraction are currently UNKNOWN.

This is because no groundwater dataset has been included in the repository and the SRS does not specify units. Until the actual dataset is provided, the application must treat recharge and extraction units as unknown rather than choosing a unit based on general knowledge.

## 8. Null and missing-value policy

The following conservative policy applies:

- missing measurements must remain missing
- do not replace missing groundwater measurements with zero
- do not fabricate values
- unknown classification should remain unknown
- invalid records should be rejected or quarantined during future ingestion
- incomplete assessments should not be silently normalized into valid records

This policy is necessary because the repository does not yet contain the actual dataset and the SRS does not authorize synthetic values.

## 9. Data provenance

Every future imported dataset should preserve provenance metadata where available, such as:

- source filename
- source/provider
- import timestamp
- dataset/version identifier

This metadata is required for traceability, but no ingestion mechanism is implemented in this ticket.

## 10. Future database mapping

The eventual application database will contain structured groundwater records aligned to the logical data contract above. At a conceptual level:

- each groundwater assessment record should be traceable to a district, block, and year
- recharge and extraction values should be stored consistently with their actual source representation
- classification should be stored according to the official dataset vocabulary once identified
- provenance metadata should be retained for future traceability

No SQL, PostgreSQL schema, migrations, or Supabase database objects are created in this ticket.

## 11. Unknowns / TBD

The following items cannot be determined without the actual groundwater dataset:

- exact column names in the source CSV or table
- recharge units
- extraction units
- exact classification vocabulary
- whether multiple assessment types exist
- whether records contain additional groundwater measurements beyond recharge, extraction, and classification
- whether district and block names require normalization
- whether the dataset contains duplicate assessments
- whether a block can have multiple records per year
- whether records are complete for all required years between 2015 and 2024
- whether the dataset contains missing or invalid rows that must be quarantined

## Important constraint

The SRS remains the authoritative source for this contract. The project must not silently supplement it with assumptions from general groundwater knowledge. If the SRS or repository does not specify a detail, it is explicitly marked as UNKNOWN or TBD.

## Summary

The application contract for NeerDrishti is intentionally minimal and dataset-aware: it centers on district, block, year, recharge, extraction, and classification, while clearly noting that several exact field names, units, and classification values remain unknown until the actual groundwater dataset is available.
