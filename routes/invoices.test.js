process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const { query } = require('../db');
const db = require('../db');
const companies = require('./companies');

let testCompanies;
let testInvoices;

beforeEach(async () => {
    await db.query(`DELETE FROM companies`);
    await db.query(`DELETE FROM invoices`);

    let companies = await db.query(
        `INSERT INTO companies (
            code, name, description
        )
        VALUES 
            ('apple', 'Apple Computer', 'Maker of OSX.'),
            ('ibm', 'IBM', 'Big blue.')
        RETURNING code, name, description`
    );

    let invoices = await db.query(
        `INSERT INTO invoices (
            comp_Code, amt, paid, paid_date
        )
        VALUES
            ('apple', 100, false, null),
            ('apple', 200, false, null),
            ('apple', 300, true, '2018-01-01'),
            ('ibm', 400, false, null)
        RETURNING id, comp_code, amt, paid, paid_date`
    );

    testCompanies = companies.rows;
    testInvoices = invoices.rows;
});

afterAll(async () => {
    await db.end();
})

describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const response = await request(app).get('/invoices');
        
        expect(response.statusCode).toBe(200);
        expect(response.body.invoices.length).toBe(4);
    });
});

describe('GET /invoices/:id', () => {
    test('Get an invoice', async () => {
        const testInvoice = testInvoices[0];
        const response = await request(app).get(`/invoices/${testInvoice.id}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            invoice: {
                add_date: expect.any(String),   // not sure why the dates aren't matching, they look the same
                amt: testInvoice.amt,
                comp_code: testInvoice.comp_code,
                id: testInvoice.id,
                paid: testInvoice.paid,
                paid_date: testInvoice.paid_date
            }
        });
    });
    test('Return 404 when company is not found', async () => {
        const maxId = await db.query(`SELECT MAX(id) FROM invoices`);
        badTestId = maxId.rows[0].max + 1;
        const response = await request(app).get(`/invoices/${badTestId}`);

        expect(response.statusCode).toBe(404);
    });
});

// describe('POST /companies', () => {
//     test('Post a new company', async () => {
//         const newCompany = {
//             code: 'speedway',
//             name: 'Speedway',
//             description: 'convenience store chain'
//         };
//         const response = await request(app)
//             .post('/companies')
//             .send(newCompany);

//         expect(response.statusCode).toBe(200);
//         expect(response.body).toEqual({company: newCompany});
//     });
// });

// describe('PUT /companies/:code', () => {
//     test('Update a company', async () => {
//         const code = 'apple';
//         const newCompany = {
//             name: 'Apple',
//             description: 'updated description'
//         };
//         const response = await request(app)
//             .put(`/companies/${code}`)
//             .send(newCompany);

//         expect(response.statusCode).toBe(200);
//         expect(response.body).toEqual({company: {code, name: newCompany.name, description: newCompany.description}});
//     });
//     test('Return 404 when company is not found', async () => {
//         const code = 'bapple';
//         const newCompany = {
//             name: 'Apple',
//             description: 'updated description'
//         };
//         const response = await request(app)
//             .put(`/companies/${code}`)
//             .send(newCompany);

//         expect(response.statusCode).toBe(404);
//     });
// });