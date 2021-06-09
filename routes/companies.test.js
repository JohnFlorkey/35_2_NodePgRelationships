process.env.NODE_ENV = "test";

const request = require('supertest');
const app = require('../app');
const { query } = require('../db');
const db = require('../db');
const companies = require('./companies');

let testCompanies;

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

    testCompanies = companies.rows;
})

afterAll(async () => {
    await db.end();
})

describe('GET /companies', () => {
    test('Get all companies', async () => {
        const response = await request(app).get('/companies');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({companies: testCompanies});
    });
});

describe('GET /companies/:code', () => {
    test('Get a company', async () => {
        const response = await request(app).get('/companies/apple');
        const company = testCompanies.filter(r => r.code === 'apple');
        const { code, name, description } = testCompanies.find(({ code }) => code === 'apple');

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({
            company: {
                code,
                name,
                description,
                invoices: expect.any(Array)
            }
        });
    });
    test('Return 404 when company is not found', async () => {
        const response = await request(app).get('/companies/bapple');

        expect(response.statusCode).toBe(404);
    });
});

describe('POST /companies', () => {
    test('Post a new company', async () => {
        const newCompany = {
            code: 'speedway',
            name: 'Speedway',
            description: 'convenience store chain'
        };
        const response = await request(app)
            .post('/companies')
            .send(newCompany);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: newCompany});
    });
});

describe('PUT /companies/:code', () => {
    test('Update a company', async () => {
        const code = 'apple';
        const newCompany = {
            name: 'Apple',
            description: 'updated description'
        };
        const response = await request(app)
            .put(`/companies/${code}`)
            .send(newCompany);

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({company: {code, name: newCompany.name, description: newCompany.description}});
    });
    test('Return 404 when company is not found', async () => {
        const code = 'bapple';
        const newCompany = {
            name: 'Apple',
            description: 'updated description'
        };
        const response = await request(app)
            .put(`/companies/${code}`)
            .send(newCompany);

        expect(response.statusCode).toBe(404);
    });
});