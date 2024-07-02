const mongoose = require('mongoose');
const axios = require('axios');
const moment = require('moment');
const Batch = require('./models/Batch');
const Entity = require('./models/Entity');
const Account = require('./models/Account');

const createMethodEntity = async (entityData) => {
	try {
    const {data: response} = await axios.post('https://dev.methodfi.com/entities', entityData, {
			headers: {
        'Method-Version': '2024-04-04',
				Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
				'Content-Type': 'application/json',
			},
		});

    const {data: entity} = response;
    if (entity.type === 'individual') {
      // phone verification
      // if (entity.verification &&
      //     entity.verification.phone &&
      //     entity.verification.phone.verified == false &&
      //     entity.verification.phone.methods &&
      //     entity.verification.phone.methods.length > 0
      // ) {
      //   await axios.post(`https://dev.methodfi.com/entities/${entity.id}/verification_sessions`, {
      //     type: 'phone',
      //     method: 'element',
      //     element: {},
      //   }, {
      //     headers: {
      //       'Method-Version': '2024-04-04',
      //       Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
      //       'Content-Type': 'application/json',
      //     },
      //   });
      // }

      // identity verification
      // if (entity.verification &&
      //     entity.verification.identity &&
      //     entity.verification.identity.verified == false &&
      //     entity.verification.identity.matched == true &&
      //     entity.verification.identity.methods &&
      //     entity.verification.identity.methods.indexOf('kba') != -1
      // ) {
      //   console.log(`method: ${entity.verification.identity.methods[0]}`);
      //   await axios.post(`https://dev.methodfi.com/entities/${entity.id}/verification_sessions`, {
      //     type: 'identity',
      //     method: 'kba',
      //     kba: {}
      //   }, {
      //     headers: {
      //       'Method-Version': '2024-04-04',
      //       Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
      //       'Content-Type': 'application/json',
      //     },
      //   });
      // }
    }

		return response.data.id;
  } catch (error) {
    console.error('Error creating Method entity:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createMethodAccount = async (account, entityId) => {
  try {
    const data = account.type === 'ach' ? {
      holder_id: entityId,
      ach: {
        routing: account.ach.routing,
        number: account.ach.number,
        type: account.ach.type,
      },
    } : {
      holder_id: entityId,
      liability: {
        mch_id: account.liability.mch_id,
        account_number: account.liability.account_number,
        type: account.liability.type,
      },
    };

    const {data: response} = await axios.post('https://dev.methodfi.com/accounts', data, {
      headers: {
        'Method-Version': '2024-04-04',
        Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // auto verify accounts to enable payment:sending capabilities
    if (account.type === 'ach') {
      await axios.post(`https://dev.methodfi.com/accounts/${response.data.id}/verification_sessions`, {type: 'auto_verify'}, {
        headers: {
          'Method-Version': '2024-04-04',
          Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
    }

    return response.data.id;
  } catch (error) {
    console.error('Error creating Method account:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const createMethodPayment = async (paymentData) => {
  try {
    const {data: response} = await axios.post('https://dev.methodfi.com/payments', paymentData, {
      headers: {
        'Method-Version': '2024-04-04',
        Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data.id;
  } catch (error) {
    console.error('Error creating Method payment:', error.response ? error.response.data : error.message);
    throw error;
  }
};

const preprocessBatch = async (batch) => {
  let paymentsCount = 0;
  let paymentsTotal = 0;
  for (const payment of batch.payments) {
    try {
      // Process employee entity
      let employeeEntity = await Entity.findOne({ dunkinId: payment.employee.dunkinId });
      if (!employeeEntity) {
        const employeeData = {
          type: 'individual',
          individual: {
            first_name: payment.employee.firstName,
            last_name: payment.employee.lastName,
						phone: '+15121231111' /* capabilities */ || payment.employee.phone,
            dob: moment(payment.employee.dob, ['MM-DD-YYYY', 'DD-MM-YYYY', 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY/MM/DD'], true).format('YYYY-MM-DD'),
          },
        };
        const methodEntityId = await createMethodEntity(employeeData);
        employeeEntity = new Entity({
          dunkinId: payment.employee.dunkinId,
          type: 'individual',
          individual: employeeData.individual,
          methodEntityId,
        });
        await employeeEntity.save();
        // console.log(`Created employee entity: ${employeeEntity}`);
      }

      // Process payor entity
      let payorEntity = await Entity.findOne({ dunkinId: payment.payor.dunkinId });
      if (!payorEntity) {
        const payorData = {
          type: 'corporation',
          corporation: {
            name: payment.payor.name,
            dba: payment.payor.dba,
            ein: payment.payor.ein,
            owners: [], // Important: pass an empty array for the `owners` key
          },
          address: {
            line1: "3300 N Interstate 35",
            line2: null,
            city: "Austin",
            state: "TX",
            zip: "78705"
          },
        };
        const methodEntityId = await createMethodEntity(payorData);
        payorEntity = new Entity({
          dunkinId: payment.payor.dunkinId,
          type: 'corporation',
          corporation: payorData.corporation,
          address: payorData.address,
          methodEntityId,
          address: {
            line1: payment.payor.address.line1,
            city: payment.payor.address.city,
            state: payment.payor.address.state,
            zip: payment.payor.address.zip,
          },
        });
        await payorEntity.save();
        // console.log(`Created payor entity: ${payorEntity}`);
      }

      // Process payor account
      let payorAccount = await Account.findOne({ holderId: payorEntity._id, 'ach.routing': payment.payor.abarouting, 'ach.number': payment.payor.accountnumber });
      if (!payorAccount) {
        const achData = {
          routing: payment.payor.abarouting,
          number: payment.payor.accountnumber,
          type: 'checking',
        };
        payorAccount = new Account({
          holderId: payorEntity._id,
          type: 'ach',
          ach: achData,
        });
        payorAccount.methodAccountId = await createMethodAccount(payorAccount, payorEntity.methodEntityId);
        await payorAccount.save();
        // console.log(`Created payor account: ${payorAccount}`);
      }

      // Process payee account
      const {data: payeeMerchantResponse} = await axios.get(`https://dev.methodfi.com/merchants?provider_id.plaid=${payment.payee.plaidId}`, {
        headers: {
          'Method-Version': '2024-04-04',
          Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
        },
      });
      const merchantId = payeeMerchantResponse.data[0].id;

      let payeeAccount = await Account.findOne({ holderId: employeeEntity._id, 'liability.account_number': payment.payee.loanaccountnumber });
      if (!payeeAccount) {
        payeeAccount = new Account({
          holderId: employeeEntity._id,
          type: 'liability',
          liability: {
            mch_id: merchantId,
            account_number: payment.payee.loanaccountnumber,
            // type: 'student_loan', // Field "liability.type" is not allowed.
          },
        });
        payeeAccount.methodAccountId = await createMethodAccount(payeeAccount, employeeEntity.methodEntityId);
        await payeeAccount.save();
        // console.log(`Created payee account: ${payeeAccount}`);
      }

      // Update payment with method IDs
      payment.payor.methodEntityId = payorEntity.methodEntityId;
      payment.payor.accountId = payorAccount.methodAccountId;
      payment.payee.methodEntityId = employeeEntity.methodEntityId;
      payment.payee.accountId = payeeAccount.methodAccountId;
      payment.status = 'pending';
      paymentsCount++;
      paymentsTotal += payment.amount;
    } catch (error) {
      payment.status = 'failed';
      payment.error = error.message;
      console.error(`Error processing payment: ${error.message}`);
    }
  }
  batch.status = 'pending';
  batch.updatedAt = new Date();
  batch.paymentsCount = paymentsCount;
  batch.paymentsTotal = paymentsTotal; // Save the total sum in the batch document
  await batch.save();
  console.log(`Batch ${batch._id} preprocessed`);
};

const processPayments = async (batch) => {
  for (const payment of batch.payments) {
    if (payment.status === 'pending') {
      try {
        const paymentData = {
          amount: payment.amount,
          source: payment.payor.accountId,
          destination: payment.payee.accountId,
          description: 'Loan Pmt',
        };
        const response = await axios.post('https://dev.methodfi.com/payments', paymentData, {
          headers: {
            'Method-Version': '2024-04-04',
            Authorization: `Bearer ${process.env.METHOD_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
        const methodPaymentId = await createMethodPayment(paymentData);
        payment.methodPaymentId = methodPaymentId;
        console.log(`Created payment: ${methodPaymentId}`);

        payment.status = 'complete';
      } catch (error) {
        console.error('Error creating Method payment:', error.response ? error.response.data : error.message);
        payment.status = 'failed';
        payment.error = error.message;
      }
    }
  }
  batch.status = 'complete';
  batch.updatedAt = new Date();
  await batch.save();
  console.log(`Batch ${batch._id} processed`);
};

const runWorker = async () => {
  const pendingBatch = await Batch.findOne({ status: 'uploaded' });
  if (pendingBatch) {
    pendingBatch.status = 'preprocessing';
    await pendingBatch.save();
    await preprocessBatch(pendingBatch);
  } else {
    const readyBatch = await Batch.findOne({ status: 'pending', approved: true });
    if (readyBatch) {
      readyBatch.status = 'processing';
      await readyBatch.save();
      await processPayments(readyBatch);
    } else {
      console.log('No batches to process. Worker is sleeping...');
    }
  }
};

module.exports = { runWorker };