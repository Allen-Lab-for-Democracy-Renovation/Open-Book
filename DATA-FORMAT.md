# Budget Data Format Guide

OpenBook accepts budget data in CSV (.csv) or Excel (.xlsx) format. This guide describes the expected column structure for each data category.

## General Rules

- One file per data category (expenses, revenues, capital)
- Files must have a header row with column names
- Maximum file size: 10MB
- Each column must have a unique name
- Empty rows are automatically skipped

## Column Mapping

OpenBook auto-detects columns using pattern matching. You can always override the auto-detected mapping during upload. The following column names are recognized:

### Expenses

| Target Field     | Common Column Names                                           |
|------------------|---------------------------------------------------------------|
| Department       | `Department`, `Dept`, `Dept Name`, `Department Name`          |
| Line Item        | `Line Item`, `Description`, `Account Description`, `Detail`   |
| Object Code      | `Object Code`, `Account`, `Account Code`, `Obj Code`          |
| Function Area    | `Function`, `Function Area`, `Program`, `Program Area`        |
| Fund Code        | `Fund`, `Fund Code`, `Fund #`, `Fund Number`                  |
| Fund Name        | `Fund Name`, `Fund Description`                               |

### Revenues

| Target Field | Common Column Names                                              |
|--------------|------------------------------------------------------------------|
| Category     | `Category`, `Revenue Category`, `Type`, `Source`                 |
| Subcategory  | `Subcategory`, `Sub-Category`, `Detail`, `Revenue Source`        |
| Line Item    | `Line Item`, `Description`, `Account Description`                |

### Capital Projects

| Target Field   | Common Column Names                                            |
|----------------|----------------------------------------------------------------|
| Department     | `Department`, `Dept`                                           |
| Purpose        | `Purpose`, `Project`, `Project Name`, `Description`            |
| Funding Source  | `Funding Source`, `Source`, `Fund Source`                      |

### Amount Columns

OpenBook supports two data layouts:

#### Wide Format (recommended for UMAS exports)

Each fiscal year + type gets its own column:

```csv
Department,Line Item,FY2025 Actual,FY2026 Budget
Police,Salaries,1200000,1250000
Police,Overtime,150000,160000
```

Recognized patterns: `FY2026 Budget`, `FY25 Actual`, `2026 Appropriation`, `Adopted 2026`

#### Long Format

A single fiscal year column and a single amount column:

```csv
Department,Line Item,Fiscal Year,Amount,Type
Police,Salaries,2026,1250000,Budget
Police,Salaries,2025,1200000,Actual
```

## Sample CSV: Expenses

```csv
Dept,Function,Description,Object Code,FY2024 Actual,FY2025 Budget,FY2026 Budget
Selectmen,General Government,Town Administrator Salary,5110,165000,170000,175000
Selectmen,General Government,Office Supplies,5400,3200,3500,3500
Police,Public Safety,Chief Salary,5110,145000,150000,155000
Police,Public Safety,Patrol Officer Salaries,5110,680000,710000,740000
```

## Sample CSV: Revenues

```csv
Category,Source,Description,FY2025 Actual,FY2026 Budget
Tax Levy,Property Tax,Real Estate Tax,28500000,29200000
Tax Levy,Property Tax,Personal Property Tax,450000,460000
State Aid,Chapter 70,School Aid,5200000,5350000
Local Receipts,Motor Vehicle,Motor Vehicle Excise,1800000,1850000
```

## Sample CSV: Capital

```csv
Department,Purpose,FY2026 Budget,Funding Source
DPW,Road Resurfacing Program,500000,Free Cash
Fire,Engine Replacement,350000,Borrowing
Schools,HVAC Replacement - Elementary,200000,Capital Stabilization
```

## Common Issues

**"File has only 1 column"**: Your CSV may be using semicolons instead of commas as delimiters. Convert to comma-separated format.

**"Duplicate column names"**: Each column must have a unique header. Rename duplicates before uploading.

**No fiscal year detected**: Make sure amount columns include the year in the header (e.g., "FY2026 Budget") or include a separate "Fiscal Year" column.

**Dollar signs and commas in amounts**: These are handled automatically. Values like `$1,250,000` and `(5000)` (negative) are parsed correctly.

## UMAS Compatibility

OpenBook is designed to work with data exported from the Massachusetts Uniform Municipal Accounting System (UMAS). If your town uses UMAS:

1. Export your budget data to Excel or CSV
2. Upload the file to OpenBook
3. The column auto-detection should recognize most UMAS column names
4. Verify the mappings and adjust any that weren't auto-detected
