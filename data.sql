\c biztime

DROP TABLE IF EXISTS company_industry;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries;


CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries (
  code text PRIMARY KEY,
  industry text
);

CREATE TABLE company_industry(
  comp_code text,
  ind_code text,
  CONSTRAINT pk_company_industry PRIMARY KEY(comp_code, ind_code),
  CONSTRAINT fk_comp_code FOREIGN KEY(comp_code) REFERENCES companies(code) ON DELETE CASCADE,
  CONSTRAINT fk_ind_code FOREIGN KEY(ind_code) REFERENCES industries(code) ON DELETE CASCADE
);

INSERT INTO companies
  VALUES  ('apple', 'Apple Computer', 'Maker of OSX.'),
          ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_Code, amt, paid, paid_date)
  VALUES  ('apple', 100, false, null),
          ('apple', 200, false, null),
          ('apple', 300, true, '2018-01-01'),
          ('ibm', 400, false, null);

INSERT INTO industries (code, industry)
  VALUES  ('consult', 'Consulting'),
          ('retail', 'Retail'),
          ('quantum', 'Quantum Computing');

INSERT INTO company_industry (comp_code, ind_code)
  VALUES  ('apple', 'retail'),
          ('ibm', 'consult'),
          ('ibm', 'quantum'),
          ('ibm', 'retail');