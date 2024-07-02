/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, render, waitFor } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import "@testing-library/jest-dom/extend-expect";
import mockStore from "../__mocks__/store";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill;

    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));
      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStore,
        localStorage: window.localStorage,
      });
    });

    test("Then the NewBill form should be rendered", () => {
      expect(screen.getByTestId("form-new-bill")).toBeTruthy();
      expect(screen.getByTestId("expense-type")).toBeTruthy();
      expect(screen.getByTestId("expense-name")).toBeTruthy();
      expect(screen.getByTestId("datepicker")).toBeTruthy();
      expect(screen.getByTestId("amount")).toBeTruthy();
      expect(screen.getByTestId("vat")).toBeTruthy();
      expect(screen.getByTestId("pct")).toBeTruthy();
      expect(screen.getByTestId("commentary")).toBeTruthy();
      expect(screen.getByTestId("file")).toBeTruthy();
      expect(screen.getByTestId("file-error")).toBeTruthy();
      expect(screen.getByTestId("btn-send-bill")).toBeTruthy();
    });

    
    describe("When I select a file with an invalid format", () => {
      test("Then it should display an error message", () => {
        const fileInput = screen.getByTestId("file");
        const invalidFile = new File(["content"], "test.pdf", {
          type: "application/pdf",
        });

        fireEvent.change(fileInput, { target: { files: [invalidFile] } });

        const errorMessage = screen.getByTestId("file-error");
        expect(errorMessage).toHaveStyle("display: block");
        expect(newBill.isFileValid).toBe(false);
      });
    });

    describe("When I select a file with a valid format", () => {
      test("Then it should not display an error message", async () => {
        const fileInput = screen.getByTestId("file");
        const validFile = new File(["content"], "test.jpg", {
          type: "image/jpeg",
        });

        fireEvent.change(fileInput, { target: { files: [validFile] } });

        // Wait for the UI to update
        await waitFor(() => {
          const errorMessage = screen.getByTestId("file-error");
          expect(errorMessage).toHaveStyle("display: block");
          expect(newBill.isFileValid).toBe(false);
        });
      });
    });

    describe("When I submit the form with an invalid file", () => {
      test("Then the form should not be submitted", () => {
        // Given
        const form = screen.getByTestId("form-new-bill");
        const fileInput = screen.getByTestId("file");
        const invalidFile = new File(["content"], "test.pdf", {
          type: "application/pdf",
        });

        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
        fireEvent.submit(form);

        expect(newBill.onNavigate).not.toHaveBeenCalled();
      });
    });
  });
});

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    let newBill;

    beforeEach(() => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      localStorage.setItem("user", JSON.stringify({ email: "test@test.com" }));

      const mockUpdate = jest.fn().mockResolvedValue({}); 

      const mockBills = jest.fn(() => ({
        update: mockUpdate
      }));

      const mockStoreWithBills = {
        bills: mockBills
      };

      newBill = new NewBill({
        document,
        onNavigate: jest.fn(),
        store: mockStoreWithBills,
        localStorage: window.localStorage,
      });
    });

    test("Then calling updateBill should update the bill and navigate to Bills page", async () => {
      // Given
      const mockBill = {
        email: "test@test.com",
        type: "Transports",
        name: "Flight Paris London",
        amount: 348,
        date: "2024-06-27",
        vat: 70,
        pct: 20,
        commentary: "Business trip",
        fileUrl: "http://example.com/test.jpg",
        fileName: "test.jpg",
        status: "pending"
      };

      newBill.billId = "bill123"; 
      await newBill.updateBill(mockBill);

      expect(newBill.store.bills().update).toHaveBeenCalled();
      expect(newBill.onNavigate).toHaveBeenCalledWith(ROUTES_PATH['Bills']);
    });
  });
});

describe("Given  when i am an employé  " , () => {
  describe("when i submit the bill form" , () => {
    test("then the bill is created", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      localStorage.setItem("user", JSON.stringify({ email: "employee@test.tld", type:"Employee" }));
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname});
    };
      // Instanciation de la nouvelle note de frais
      const newBillContainer = new NewBill({
        document,
        localStorage: window.localStorage,
        store: null,
        onNavigate,
      }); 

       screen.getByTestId('expense-type').value = 'Transports';
       screen.getByTestId('expense-name').value = 'Paris';
       screen.getByTestId('datepicker').value = '2024-07-02';
       screen.getByTestId('amount').value = 100;
       screen.getByTestId('vat').value = 10;
       screen.getByTestId('pct').value = 10;
       screen.getByTestId('commentary').value = 'test';
       newBillContainer.fileUrl = "../facture.jpg"
       newBillContainer.fileName = 'facture.jpg'

       newBillContainer.updateBill = jest.fn()

       // Simulation de la soumission du formulaire
      const handleSubmit = jest.fn((e) => newBillContainer.handleSubmit(e));
      const billForm = screen.getByTestId('form-new-bill');
      billForm.addEventListener('submit', handleSubmit);

      fireEvent.submit(billForm);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
        expect(newBillContainer.updateBill).toHaveBeenCalled();
      });
    });
  });
});

