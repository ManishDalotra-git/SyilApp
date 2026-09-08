require('dotenv').config();

const {
  initializeApp,
  cert,
  getApps,
} = require('firebase-admin/app');

const { getMessaging } = require(
  'firebase-admin/messaging',
);

if (!process.env.FIREBASE_ADMIN_SDK) {
  throw new Error(
    'FIREBASE_ADMIN_SDK environment variable is missing',
  );
}

const firebaseServiceAccount = JSON.parse(
  process.env.FIREBASE_ADMIN_SDK,
);

if (getApps().length === 0) {
  initializeApp({
    credential: cert(firebaseServiceAccount),
  });
}

console.log('Firebase Admin initialized');

const express = require('express');
const bodyParser = require('body-parser');

const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const multer = require('multer');
const { send } = require('process');
const hubspotUpload = multer({
  dest: 'uploads/'
});

const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log('api--- ', HUBSPOT_API_KEY);
console.log('OPENAI_API_KEY--- ', OPENAI_API_KEY);





app.post('/ask-alex', async (req, res) => {
  const { question } = req.body;
  console.log('question---- ', question);
  try {
    
     console.log('question----try00 ', question);
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-5-mini',
        tools: [{ type: 'web_search' }],
        input: [
          {
            role: 'system',
            content:`
              You are "Alex", a professional AI support assistant for SYIL.

              ========================
              CORE KNOWLEDGE RULES
              ========================
              - Answer ONLY using information available on:
                • https://syil.com
                • https://syil.com/dealer-portal
              - Do NOT use external knowledge, assumptions, or general CNC information.
              - If requested information is not available on the official SYIL websites, say so clearly and politely.

              ========================
              GREETING & SMALL TALK
              ========================
              - If the user says "hi", "hello", "hey":
                Respond:
                "Hello! Welcome to SYIL Support. I'm Alex, your AI assistant 🙂.\n\nHow are you today? How may I assist you?"

              - If the user asks "how are you", "how are you doing":
                Respond professionally and friendly:
                "I'm doing well, thank you for asking. How are you today? How may I assist you?"

              - Do NOT include key features, machines, or product details in greeting or small talk responses.

              ========================
              SYIL / MACHINE / PRODUCT QUESTIONS
              ========================
              - ONLY when the user asks about:
                • SYIL as a company
                • CNC machines
                • Specific models (X5, X7, X9, X11, L-series, G2, R1, etc.)
                • Capabilities, specifications, or use cases
              - Then:
                - Provide a clear, accurate, and professional response.
                - Include a clearly labeled **"Key Features"** section in bullet points.
                - Ensure every feature is sourced from official SYIL website content.
                - Do not exaggerate or add marketing claims.

              ========================
              DEALER PORTAL & RESTRICTED INFO
              ========================
              - If the user asks about:
                • Pricing
                • Dealer access
                • Private documents
                • Restricted resources
              - Respond that this information is available through authorized dealers only.
              - Guide the user to the SYIL Dealer Portal.
              - Never guess or invent confidential information.

              ========================
              CLARIFICATION RULE
              ========================
              - If the user's question is unclear or incomplete, ask ONE short clarification question before answering.

              ========================
              TONE & STYLE
              ========================
              - Professional, polite, and friendly.
              - Clear and structured responses.
              - Use bullet points for features.
              - Avoid unnecessary verbosity or casual slang.

              ========================
              FALLBACK RULE
              ========================
              - If the question is unrelated to SYIL or not covered on the official websites:
                Respond:
                "This information is not available on the official SYIL website. Please contact SYIL support or an authorized dealer for further assistance."
              `
          },
          {
            role: 'user',
            content: question
          }
        ],
        text: {
          format: { type: 'text' }
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    
    const messageBlock = response.data.output.find(
      o => o.type === 'message'
    );

    const content = messageBlock?.content?.[0] || {};
    const text = content.text || '';
    const annotations = content.annotations || [];

      
    const title =
      annotations.length > 0 && annotations[0].title
        ? annotations[0].title
        : '';


        console.log('content---- ', content);
        console.log('text---- ', text);
        console.log('annotations---- ', annotations);
        console.log('title---- ', title);

    return res.json({
      title,
      text
    });

  } catch (error) {
    console.error('OpenAI Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to fetch answer from OpenAI'
    });
  }
});





app.get('/articles', (req, res) => {
  const filePath = path.join(__dirname, 'assets', 'articles.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to read articles' });
    }

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (e) {
      res.status(500).json({ message: 'Invalid JSON format' });
    }
  });
});









const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/json') {
      return cb(new Error('Only JSON files are allowed'));
    }
    cb(null, true);
  }
});

app.post('/upload-articles', upload.single('file'), (req, res) => {
  const tempPath = req.file.path;
  const targetPath = path.join(__dirname, 'assets', 'articles.json');

  fs.readFile(tempPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ message: 'Error reading file' });
    try {
      JSON.parse(data);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid JSON file' });
    }

    fs.writeFile(targetPath, data, 'utf8', (err) => {
      if (err) return res.status(500).json({ message: 'Error saving file' });

      fs.unlinkSync(tempPath);

      res.json({ message: 'articles.json updated successfully' });
    });
  });
});




app.post(
  '/save-dealer-fcm-token',
  async (req, res) => {
    const {
      email,
      fcmToken,
      platform,
    } = req.body;

    if (!email || !fcmToken) {
      return res.status(400).json({
        success: false,
        message:
          'Email and FCM token are required',
      });
    }

    try {
      const fetch = (...args) =>
        import('node-fetch').then(
          ({ default: fetch }) => fetch(...args),
        );

      /*
       * Find HubSpot contact.
       */
      const searchResponse = await fetch(
        'https://api.hubapi.com/crm/v3/objects/contacts/search',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName: 'email',
                    operator: 'EQ',
                    value: email
                      .trim()
                      .toLowerCase(),
                  },
                ],
              },
            ],
            properties: [
              'email',
              'dealer_fcm_token',
            ],
            limit: 1,
          }),
        },
      );

      const searchData =
        await searchResponse.json();

      if (!searchResponse.ok) {
        console.error(
          'HubSpot contact search error:',
          searchData,
        );

        return res.status(searchResponse.status).json({
          success: false,
          message:
            'Unable to search HubSpot contact',
          detail: searchData,
        });
      }

      if (!searchData.results?.length) {
        return res.status(404).json({
          success: false,
          message: 'HubSpot contact not found',
        });
      }

      const contactId =
        searchData.results[0].id;

      /*
       * Save Dealer app FCM token.
       */
      const updateResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              dealer_fcm_token: fcmToken,
            },
          }),
        },
      );

      const updateText =
        await updateResponse.text();

      let updateData = {};

      try {
        updateData = updateText
          ? JSON.parse(updateText)
          : {};
      } catch {
        updateData = {
          rawResponse: updateText,
        };
      }

      if (!updateResponse.ok) {
        console.error(
          'HubSpot token update error:',
          updateData,
        );

        return res.status(updateResponse.status).json({
          success: false,
          message:
            'Dealer FCM token could not be saved',
          detail: updateData,
        });
      }

      console.log(
        `Dealer FCM token saved for contact ${contactId}, platform ${platform || 'unknown'}`,
      );

      return res.status(200).json({
        success: true,
        message:
          'Dealer FCM token saved successfully',
        contactId,
        platform: platform || '',
      });
    } catch (error) {
      console.error(
        'Save dealer FCM token error:',
        error,
      );

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  },
);



app.post('/get-contact-id', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    // ✅ Contact Found
    if (searchResponse.ok && searchData.results?.length > 0) {
      return res.json({
        contactId: searchData.results[0].id,
        created: false,
      });
    }

    // 2️⃣ CREATE CONTACT (IF NOT FOUND)
    const createResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            email: email,
            hubspot_owner_id: '86106481'
          },
        }),
      }
    );

    const createData = await createResponse.json();

    if (createResponse.ok) {
      return res.json({
        contactId: createData.id,
        created: true,
      });
    } else {
      return res.status(createResponse.status).json(createData);
    }

  } catch (error) {
    console.error('Contact Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Step 2: Create ticket and associate with contact
const uploadedFiles = [];
app.post('/upload-to-hubspot', hubspotUpload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ success: true, files: [] });
    }
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('fileName', file.originalname);
      formData.append('folderId', '204201997753');
      formData.append(
        'options',
        JSON.stringify({ access: 'PUBLIC_INDEXABLE' })
      );
      const response = await axios.post(
        'https://api.hubapi.com/files/v3/files',
        formData,
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            ...formData.getHeaders(),
          },
        }
      );
      uploadedFiles.push({
        id: response.data.id,
        url: response.data.url,
      });
      fs.unlinkSync(file.path);
    }
    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (err) {
    console.log(err.response?.data || err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

// 2️⃣ Create ticket via HubSpot form submission
app.post('/create-ticket', async (req, res) => {
  try {
    const { contactId, ticketData } = req.body;

    // 🔥 IMPORTANT: ticketData ke andar se values nikalo
    if (!ticketData) {
      return res.status(400).json({ error: 'ticketData missing' });
    }

    const {
      email,
      company,
      machineType,
      controller,
      serialNo,
      salesOrder,
      subject,
      description,
      priority,
      warranty,
      categories,
      files,
    } = ticketData;

    // 🟡 safety
    const categoryArray = Array.isArray(categories) ? categories : [];

    // ✅ HubSpot FORM FIELDS (value kabhi undefined nahi)
    const fields = [
      { objectTypeId: '0-1', name: 'email', value: email || '' },

      { objectTypeId: '0-5', name: 'subject', value: subject || '' },
      { objectTypeId: '0-5', name: 'content', value: description || '' },
      { objectTypeId: '0-5', name: 'end_customer_name', value: company || '' },
      { objectTypeId: '0-5', name: 'machine_type', value: machineType || '' },
      { objectTypeId: '0-5', name: 'controller', value: controller || '' },
      { objectTypeId: '0-5', name: 'machine_serial_number', value: serialNo || '' },
      { objectTypeId: '0-5', name: 'sales_order_number', value: salesOrder || '' },
      {
        objectTypeId: '0-5',
        name: 'warranty',
        value: warranty ? 'true' : 'false',
      },
      {
        objectTypeId: '0-5',
        name: 'hs_ticket_priority',
        value: priority || 'LOW',
      },
      {
        objectTypeId: '0-5',
        name: 'hs_ticket_category',
        value: categoryArray.join(';') || '',
      },
      {
        objectTypeId: '0-5',
        name: 'source_status',
        value: 'Mobile',
      },
    ];

  

    console.log('uploadedFiles----- ', uploadedFiles);

    if ( uploadedFiles && uploadedFiles.length > 0 ) 
        {
          const fileIds = uploadedFiles.map(f => f.id);

          fields.push({
            objectTypeId: '0-5',
            name: 'hs_file_upload', // HubSpot form file field name
            value: fileIds.join(';'),
          });
        }

    const formUrl = 'https://api.hsforms.com/submissions/v3/integration/submit/4392290/d3c790a4-c601-4a54-b826-0a5ca3f57428';


    console.log('fields---- ' , fields);

    const response = await axios.post(
      formUrl,
      { fields },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    uploadedFiles.length = 0;
    console.log(response);
    console.log('HubSpot STATUS:', response.status);


    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    await new Promise(resolve => setTimeout(resolve, 15000));

    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['mobile_ticket_id'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    const mobile_ticket_id =
      searchData?.results?.[0]?.properties?.mobile_ticket_id || null;

    /* ------------------ 3️⃣ FINAL RESPONSE ------------------ */

    return res.status(200).json({
      success: true,
      message: 'Ticket created successfully',
      contactId,
      mobile_ticket_id,
    });
    
    // return res.status(200).json({
    //   success: true,
    //   message: `Ticket created successfully ${response}`,
    // });

    


  } catch (err) {
    console.error(
      '❌ Error in /create-ticket:',
      err.response?.data || err.message
    );
    return res.status(500).json({ error: 'Ticket creation failed' });
  }
});


// app.post('/create-ticket', async (req, res) => {
//   const { contactId, ticketData } = req.body;
//   if (!contactId) {
//     return res.status(400).json({ error: 'Contact ID is required' });
//   }
//   try {
//     const fetch = (...args) =>
//       import('node-fetch').then(({ default: fetch }) => fetch(...args));
//       const properties = {
//         subject: ticketData.subject,
//         content: ticketData.description,
//         hs_pipeline: '94161297',
//         hs_pipeline_stage: '173580710',
//         hs_ticket_priority: ticketData.priority?.toUpperCase() || 'LOW',
//         end_customer_name: ticketData.company,
//         machine_type: ticketData.machineType,
//         controller: ticketData.controller,
//         machine_serial_number: ticketData.serialNo,
//         sales_order_number: ticketData.salesOrder,
//         warranty: ticketData.warranty,
//         hs_ticket_category: ticketData.categories?.join(';'),
//         hubspot_owner_id: '86106481',
//         hs_assigned_team_ids: '46557382',
//       };

//       if ( uploadedFiles && uploadedFiles.length > 0 ) 
//         {
//           const fileIds = uploadedFiles.map(f => f.id);
//           properties.hs_file_upload = fileIds.join(';');
//           console.log('uploadedFiles--- ticket----- ', uploadedFiles);
//         }

//         console.log('properties----- ' , properties);

//       const response = await fetch(
//         'https://api.hubapi.com/crm/v3/objects/tickets',
//         {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${HUBSPOT_API_KEY}`,
//           },
//           body: JSON.stringify({
//             properties,
//             associations: [
//               {
//                 to: { id: contactId },
//                 types: [
//                   {
//                     associationCategory: 'HUBSPOT_DEFINED',
//                     associationTypeId: 16,
//                   },
//                 ],
//               },
//             ],
//           }),
//         }
//       );
//     const data = await response.json();
//     res.status(response.ok ? 201 : response.status).json(data);
//   } catch (error) {
//     console.error('Create Ticket Error:', error);
//     res.status(500).json({ error: 'Internal server error' });  
//   }
// });




// app.post('/upload-to-hubspot', upload.array('files'), async (req, res) => {
//   try {
//     const uploadedFiles = [];

//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const formData = new FormData();
//         formData.append('file', fs.createReadStream(file.path));
//         formData.append('fileName', file.originalname);
//         formData.append('folderId', '204201997753'); // Change to your folder ID
//         formData.append('options', JSON.stringify({ access: 'PUBLIC_INDEXABLE' }));

//         const response = await axios.post(
//           'https://api.hubapi.com/files/v3/files',
//           formData,
//           { headers: { Authorization: `Bearer ${HUBSPOT_API_KEY}`, ...formData.getHeaders() } }
//         );

//         uploadedFiles.push({ id: response.data.id, url: response.data.url });

//         fs.unlinkSync(file.path);
//       }
//     }

//     res.status(200).json({ files: uploadedFiles });
//   } catch (err) {
//     console.error(err.response?.data || err.message || err);
//     res.status(500).json({ error: 'File upload failed' });
//   }
// });









// app.post('/create-ticket', async (req, res) => {
//   const { contactId, ticketData } = req.body;
//   console.log('ticketData--- ', ticketData);
//   if (!contactId || !ticketData?.subject) {
//     return res.status(400).json({
//       error: 'Contact ID and subject are required',
//     });
//   }

//   try {
//     const fetch = (...args) =>
//       import('node-fetch').then(({ default: fetch }) => fetch(...args));

//     // 🔹 HubSpot Form Submission API
//     const response = await fetch(
//       'https://api.hsforms.com/submissions/v3/integration/submit/4392290/d3c790a4-c601-4a54-b826-0a5ca3f57428',
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           fields: [
//             { name: 'subject', value: ticketData.subject },
//             { name: 'content', value: ticketData.description },
//             { name: 'hs_ticket_priority', value: ticketData.priority },
//             { name: 'company', value: ticketData.company },
//             { name: 'machine_type', value: ticketData.machineType },
//             { name: 'controller', value: ticketData.controller },
//             { name: 'machine_serial_number', value: ticketData.serialNo },
//             { name: 'sales_order_number', value: ticketData.salesOrder },
//             { name: 'warranty', value: ticketData.warranty },
//             { name: 'email', value: ticketData.email },
//             {
//               name: 'hs_ticket_category',
//               value: ticketData.categories?.join(';'),
//             },
//           ],
//         }),
//       }
//     );

//     const data = await response.json();

//     if (!response.ok) {
//       console.error('Form submission failed:', data);
//       return res.status(500).json({
//         error: 'Ticket submission failed',
//         data,
//       });
//     }

//     // ✅ SAME response variable name
//     return res.status(201).json({
//       success: true,
//       message: 'Ticket created successfully',
//       data,
//     });

//   } catch (error) {
//     console.error('Create Ticket Error:', error);
//     return res.status(500).json({
//       error: 'Internal server error',
//     });
//   }
// });





app.post('/get-user-data', async (req, res) => {
  const { email } = req.body;

  try {
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['app_support_team_member'],
        }),
      }
    );

    const data = await searchResponse.json();

    if (!data.results.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      app_support_team_member:
        data.results[0].properties.app_support_team_member || '',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Server error' });
  }
});





// Step 3: check login details in hubspot
app.post('/check_login_detail', async (req, res) => {
  const { email, password } = req.body;
  console.log('email---- ' , email);
  console.log(HUBSPOT_API_KEY);
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // 1️⃣ SEARCH CONTACT BY EMAIL
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: ['email', 'mobile_password', 'firstname', 'lastname', 'profile_image', 'bio', 'phone', 'gender', 'app_support_team_member'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    // EMAIL NOT FOUND
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(401).json({
        message: 'Invalid email, please enter your valid email',
      });
    }

    // CONTACT FOUND
    const contact = searchData.results[0];
    const contactId = contact.id;
    const hubspotPassword = contact.properties.mobile_password;

    // PASSWORD NOT SET
    if (!hubspotPassword) {
      return res.status(401).json({
        message: 'Password not set for this account',
      });
    }

    // PASSWORD DOES NOT MATCH
    if (hubspotPassword !== password) {
      return res.status(401).json({
        message: 'Please enter a valid password',
      });
    }

    // LOGIN SUCCESS
    return res.status(200).json({
      message: 'Login successful',
      contactId: contactId,
      user: {
        email: contact.properties.email,
        firstName: contact.properties.firstname || '',
        lastName: contact.properties.lastname || '',
        profileImage: contact.properties.hs_avatar_url || '',
        bio: contact.properties.bio || '',
        phone: contact.properties.phone || '',
        gender: contact.properties.gender || '',
        app_support_team_member: contact.properties.app_support_team_member || '',
      },
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});


// Step 3: Forgot Password
app.post('/forgot_password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // 1️⃣ Search contact by email in HubSpot
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    // Email not found
    if (!searchData.results || searchData.results.length === 0) {
      return res.status(404).json({ message: 'Please enter a valid email.' });
    }

    // 2️⃣ Submit email to HubSpot form endpoint
    const formResponse = await fetch(
      'https://api.hsforms.com/submissions/v3/integration/submit/4392290/635124f0-b15f-40c2-9806-5405ca736690',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          fields: [
            {
              objectTypeId: '0-1',
              name: 'email',
              value: email,
            },
          ],
        }),
      }
    );

    if (!formResponse.ok) {
      const formError = await formResponse.text();
      console.error('Form submission error:', formError);
      return res.status(500).json({
        message: 'Failed to submit form. Please try again later.',
      });
    }

    // Success response
    return res.status(200).json({
      message:
        'Thank you for submitting the form. Please check your email to reset your password. If you do not see the email in your inbox, please check your spam or junk folder as well.',
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});




app.post('/submit-feedback', async (req, res) => {
  const { email, subject, message, rating } = req.body;

  console.log('req__body_____ ', req.body);

  if (!email || !subject) {
    return res.status(400).json({ error: 'Email and Subject are required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // -------- Step 1: Search contact --------
    const searchResponse = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                { propertyName: 'email', operator: 'EQ', value: email },
              ],
            },
          ],
          properties: ['email'],
        }),
      }
    );

    const searchData = await searchResponse.json();

    if (!searchResponse.ok || !searchData.results?.length) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const contactId = searchData.results[0].id;

    // -------- Step 2: Create Feedback object & associate with contact --------
    const HUBSPOT_FEEDBACK_OBJECT_ID = '2-56321597'; // your feedback object type

    const feedbackResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/${HUBSPOT_FEEDBACK_OBJECT_ID}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            subject: subject,
            what_went_wrong: message,
            rating: rating,
          },
          associations: [
            {
              to: { id: contactId },
              types: [{ associationCategory: 'USER_DEFINED', associationTypeId: 131 }]
            }
          ]
        })
      }
    );

    const feedbackData = await feedbackResponse.json();

    if (!feedbackResponse.ok) {
      return res.status(feedbackResponse.status).json(feedbackData);
    }

    res.json({ success: true, feedback: feedbackData, contactId });

  } catch (error) {
    console.error('Submit Feedback Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.post('/get-profile-by-email', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: 'Email is required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const response = await fetch(
      'https://api.hubapi.com/crm/v3/objects/contacts/search',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email,
                },
              ],
            },
          ],
          properties: [
            'email',
            'firstname',
            'lastname',
            'bio',
            'phone',
            'gender',
          ],
        }),
      }
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const contact = data.results[0].properties;

    // ✅ RESPONSE FOR PROFILE.JSX
    res.status(200).json({
      user: {
        email: contact.email || '',
        firstname: contact.firstname || '',
        lastname: contact.lastname || '',
        bio: contact.bio || '',
        phone: contact.phone || '',
        gender: contact.gender || '',
      },
    });

  } catch (error) {
    console.error('HubSpot API Error:', error);
    res.status(500).json({
      message: 'Internal server error',
    });
  }
});



app.post('/update-profile', async (req, res) => {
  const { contactId, firstName, lastName, bio, phone, gender, image } = req.body;

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    const response = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
        body: JSON.stringify({
          properties: {
            firstname: firstName,
            lastname: lastName,
            bio,
            phone,
            gender,
            hs_avatar_url: image,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(400).json({ err });
    }

    res.json({
      success: true,
      user: { firstName, lastName, bio, phone, gender, profileImage: image },
    });

  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});


//Get Ticket Details
// app.post('/get_contact_tickets', async (req, res) => {
//   const { contactId } = req.body;

//   console.log('contactId---- ', contactId);
//   if (!contactId) {
//     return res.status(400).json({
//       message: 'Contact ID is required',
//     });
//   }

//   try {
//     const fetch = (...args) =>
//       import('node-fetch').then(({ default: fetch }) => fetch(...args));

//     // 1️⃣ GET TICKET ASSOCIATIONS
//     const associationResponse = await fetch(
//       `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/ticket`,
//       {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const associationData = await associationResponse.json();


//     if (!associationData.results || associationData.results.length === 0) {
//       return res.status(200).json({
//         message: 'No tickets found',
//         tickets: [],
//       });
//     }

//     // 2️⃣ EXTRACT TICKET IDS
//     const ticketIds = associationData.results.map(item => item.id);

//     // 3️⃣ FETCH EACH TICKET DETAIL
//     const ticketPromises = ticketIds.map(ticketId =>
//       fetch(
//         `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=subject,createdate,hubspot_owner_id,hs_pipeline_stage`,
//         {
//           method: 'GET',
//           headers: {
//             'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       ).then(res => res.json())
//     );

//     const ticketResponses = await Promise.all(ticketPromises);

//     // 4️⃣ FORMAT RESPONSE (UI FRIENDLY)
//     const formattedTickets = ticketResponses.map(ticket => ({
//       ticketId: ticket.id,
//       subject: ticket.properties.subject || '',
//       createdDate: ticket.properties.createdate || '',
//       ownerId: ticket.properties.hubspot_owner_id || '',
//       status: ticket.properties.hs_pipeline_stage || '',
//     }));

//     return res.status(200).json({
//       message: 'Tickets fetched successfully',
//       tickets: formattedTickets,
//     });

//   } catch (error) {
//     console.error('Ticket Fetch Error:', error);
//     return res.status(500).json({
//       message: 'Internal server error',
//     });
//   }
// });









// ============================================================
// DEALER UNREAD HELPERS
// ============================================================

async function getDealerTotalUnreadCount(contactId, fetch) {
  try {
    if (!contactId) {
      return 0;
    }

    const associationResponse = await fetch(
      `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/ticket`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const associationData =
      await associationResponse.json();

    if (!associationResponse.ok) {
      console.error(
        'Dealer ticket association error:',
        associationData
      );

      return 0;
    }

    const ticketIds =
      (associationData.results || [])
        .map(item => String(item.id))
        .filter(Boolean);

    if (!ticketIds.length) {
      return 0;
    }

    const ticketRequests =
      ticketIds.map(ticketId =>
        fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=customer_portal,dealer_unread_count`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type':
                'application/json',
            },
          }
        ).then(response =>
          response.json()
        )
      );

    const tickets =
      await Promise.all(ticketRequests);

    const totalUnreadCount =
      tickets.reduce(
        (total, ticket) => {
          const portalValue =
            String(
              ticket.properties
                ?.customer_portal || ''
            )
              .trim()
              .toLowerCase();

          const customerPortal =
            portalValue === 'true' ||
            portalValue === 'yes' ||
            portalValue === '1';

          if (customerPortal) {
            return total;
          }

          return (
            total +
            Number(
              ticket.properties
                ?.dealer_unread_count || 0
            )
          );
        },
        0
      );

    return totalUnreadCount;

  } catch (error) {
    console.error(
      'getDealerTotalUnreadCount error:',
      error
    );

    return 0;
  }
}


async function getSupportOwnerTotalUnreadCount(
  ownerId,
  fetch
) {
  try {
    if (!ownerId) {
      return 0;
    }

    let allTickets = [];
    let after = null;

    do {
      const response = await fetch(
        'https://api.hubapi.com/crm/v3/objects/tickets/search',
        {
          method: 'POST',
          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName:
                      'hubspot_owner_id',
                    operator: 'EQ',
                    value: String(ownerId),
                  },
                ],
              },
            ],

            properties: [
              'dealer_unread_count',
              'customer_portal',
            ],

            limit: 100,

            ...(after
              ? { after }
              : {}),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          'Support owner unread search error:',
          data
        );

        break;
      }

      allTickets = [
        ...allTickets,
        ...(data.results || []),
      ];

      after =
        data?.paging?.next?.after ||
        null;

    } while (after);

    const totalUnreadCount =
      allTickets.reduce(
        (total, ticket) => {
          const portalValue =
            String(
              ticket.properties
                ?.customer_portal || ''
            )
              .trim()
              .toLowerCase();

          const customerPortal =
            portalValue === 'true' ||
            portalValue === 'yes' ||
            portalValue === '1';

          if (customerPortal) {
            return total;
          }

          return (
            total +
            Number(
              ticket.properties
                ?.dealer_unread_count || 0
            )
          );
        },
        0
      );

    return totalUnreadCount;

  } catch (error) {
    console.error(
      'getSupportOwnerTotalUnreadCount error:',
      error
    );

    return 0;
  }
}





// ============================================================
// HUBSPOT CONVERSATION WEBHOOK
// ============================================================

app.post('/hubspot-webhook', async (req, res) => {

  /*
   * HubSpot ko immediately 200 response dena important hai.
   * Isse webhook unnecessary retry nahi karega.
   */
  res.sendStatus(200);

  try {

    console.log(
      '========== HUBSPOT WEBHOOK RECEIVED =========='
    );

    console.log(
      'Webhook body:',
      JSON.stringify(req.body, null, 2)
    );

    const events =
      Array.isArray(req.body)
        ? req.body
        : [];

    if (!events.length) {
      console.log(
        'Webhook body is empty'
      );
      return;
    }

    /*
     * HubSpot webhook event.
     */
    const event = events[0];

    const threadId =
      event.objectId;

    const webhookMessageId =
      event.messageId;

    console.log(
      'Thread ID:',
      threadId
    );

    console.log(
      'Webhook Message ID:',
      webhookMessageId
    );

    console.log(
      'Subscription Type:',
      event.subscriptionType
    );

    if (
      !threadId ||
      !webhookMessageId
    ) {
      console.log(
        'Thread ID or webhook message ID missing'
      );

      return;
    }

    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) =>
          fetch(...args)
      );


    // ========================================================
    // STEP 1
    // GET THREAD MESSAGES
    // ========================================================

    const messagesResponse =
      await fetch(
        `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
        {
          method: 'GET',

          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type':
              'application/json',
          },
        }
      );

    const messagesData =
      await messagesResponse.json();

    console.log(
      'HubSpot messages status:',
      messagesResponse.status
    );

    if (!messagesResponse.ok) {

      console.error(
        'HubSpot messages API error:',
        JSON.stringify(
          messagesData,
          null,
          2
        )
      );

      return;
    }

    const availableMessages =
      messagesData.results || [];

    /*
     * Exact webhook message find karo.
     */
    const latestMessage =
      availableMessages.find(
        message =>
          message.type === 'MESSAGE' &&
          String(message.id) ===
            String(webhookMessageId)
      );

    if (!latestMessage) {

      console.log(
        'Exact webhook message not found in thread'
      );

      return;
    }

    console.log(
      'Matched message direction:',
      latestMessage.direction
    );

    console.log(
      'Matched message text:',
      latestMessage.text
    );


    // ========================================================
    // STEP 2
    // ONLY MESSAGE EVENTS
    // ========================================================

    const allowedDirections = [
      'INCOMING',
      'OUTGOING',
    ];

    if (
      !allowedDirections.includes(
        latestMessage.direction
      )
    ) {

      console.log(
        `Notification skipped because direction is ${latestMessage.direction}`
      );

      return;
    }


    // ========================================================
    // STEP 3
    // FIND TICKET USING THREAD ID
    // ========================================================

    const ticketSearchResponse =
      await fetch(
        'https://api.hubapi.com/crm/v3/objects/tickets/search',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            filterGroups: [
              {
                filters: [
                  {
                    propertyName:
                      'hs_conversations_originating_thread_id',

                    operator:
                      'EQ',

                    value:
                      String(threadId),
                  },
                ],
              },
            ],

            properties: [
              'subject',
              'customer_portal',
              'hs_conversations_originating_thread_id',
              'dealer_unread_count',
              'hubspot_owner_id',
            ],

            limit: 1,
          }),
        }
      );

    const ticketSearchData =
      await ticketSearchResponse.json();

    console.log(
      'Ticket search status:',
      ticketSearchResponse.status
    );

    if (!ticketSearchResponse.ok) {

      console.error(
        'Ticket search error:',
        JSON.stringify(
          ticketSearchData,
          null,
          2
        )
      );

      return;
    }

    if (
      !ticketSearchData.results?.length
    ) {

      console.log(
        'No ticket found for thread:',
        threadId
      );

      return;
    }

    const matchedTicket =
      ticketSearchData.results[0];

    const ticketId =
      String(matchedTicket.id);

    const ticketSubject =
      matchedTicket.properties
        ?.subject || '';

    const ticketOwnerId =
      String(
        matchedTicket.properties
          ?.hubspot_owner_id || ''
      );

    console.log(
      'Matched Ticket ID:',
      ticketId
    );

    console.log(
      'Ticket Subject:',
      ticketSubject
    );

    console.log(
      'Ticket HubSpot Owner ID:',
      ticketOwnerId ||
        'Not assigned'
    );


    // ========================================================
    // STEP 4
    // CUSTOMER PORTAL CHECK
    // ========================================================

    const rawCustomerPortal =
      matchedTicket.properties
        ?.customer_portal;

    const normalizedCustomerPortal =
      String(
        rawCustomerPortal ?? ''
      )
        .trim()
        .toLowerCase();

    const isCustomerPortalTicket =
      rawCustomerPortal === true ||
      normalizedCustomerPortal === 'true' ||
      normalizedCustomerPortal === 'yes' ||
      normalizedCustomerPortal === '1';

    console.log(
      'customer_portal raw value:',
      rawCustomerPortal
    );

    console.log(
      'Is customer portal ticket:',
      isCustomerPortalTicket
    );

    /*
     * Customer Portal ticket Dealer App
     * notification ke liye process nahi hoga.
     */
    if (
      isCustomerPortalTicket
    ) {

      console.log(
        'Dealer push skipped: customer_portal is true'
      );

      return;
    }

    console.log(
      'Dealer ticket confirmed'
    );


    // ========================================================
    // STEP 5
    // FIND TICKET OWNER EMAIL
    // ========================================================

    let ticketOwnerEmail = '';

    if (ticketOwnerId) {

      try {

        const ownerResponse =
          await fetch(
            `https://api.hubapi.com/crm/v3/owners/${ticketOwnerId}`,
            {
              method: 'GET',

              headers: {
                Authorization:
                  `Bearer ${HUBSPOT_API_KEY}`,
                'Content-Type':
                  'application/json',
              },
            }
          );

        const ownerData =
          await ownerResponse.json();

        if (ownerResponse.ok) {

          ticketOwnerEmail =
            ownerData.email
              ?.trim()
              ?.toLowerCase() || '';

          console.log(
            'Ticket Owner Email:',
            ticketOwnerEmail ||
              'Not available'
          );

        } else {

          console.error(
            'Ticket owner fetch failed:',
            ownerData
          );
        }

      } catch (error) {

        console.error(
          'Ticket owner fetch error:',
          error
        );
      }
    }


    // ========================================================
    // STEP 6
    // TICKET UNREAD COUNT + 1
    // ========================================================

    const currentTicketUnreadCount =
      Number(
        matchedTicket.properties
          ?.dealer_unread_count || 0
      );

    const newTicketUnreadCount =
      currentTicketUnreadCount + 1;

    console.log(
      `Ticket ${ticketId} unread: ${currentTicketUnreadCount} -> ${newTicketUnreadCount}`
    );

    const ticketUnreadUpdateResponse =
      await fetch(
        `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`,
        {
          method: 'PATCH',

          headers: {
            Authorization:
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            properties: {
              dealer_unread_count:
                String(
                  newTicketUnreadCount
                ),
            },
          }),
        }
      );

    const ticketUnreadUpdateText =
      await ticketUnreadUpdateResponse.text();

    if (
      !ticketUnreadUpdateResponse.ok
    ) {

      console.error(
        'Ticket unread count update failed:',
        ticketUnreadUpdateText
      );

      return;
    }

    console.log(
      'Ticket unread count updated successfully:',
      newTicketUnreadCount
    );


    // ========================================================
    // STEP 7
    // IDENTIFY MESSAGE SENDER
    // ========================================================

    const senderEmail =
      latestMessage.senders?.[0]
        ?.deliveryIdentifier
        ?.value
        ?.trim()
        ?.toLowerCase() || '';

    console.log(
      'Message sender email:',
      senderEmail ||
        'Not available'
    );

    let senderIsSupport =
      false;

    let senderContactName =
      '';

    let senderContactFound =
      false;


    if (senderEmail) {

      const senderSearchResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts/search',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              filterGroups: [
                {
                  filters: [
                    {
                      propertyName:
                        'email',

                      operator:
                        'EQ',

                      value:
                        senderEmail,
                    },
                  ],
                },
              ],

              properties: [
                'email',
                'firstname',
                'lastname',
                'app_support_team_member',
              ],

              limit: 1,
            }),
          }
        );

      const senderSearchData =
        await senderSearchResponse.json();

      console.log(
        'Sender contact search status:',
        senderSearchResponse.status
      );

      if (
        senderSearchResponse.ok &&
        senderSearchData.results?.length
      ) {

        senderContactFound =
          true;

        const senderContact =
          senderSearchData.results[0];

        const supportValue =
          String(
            senderContact.properties
              ?.app_support_team_member ??
              ''
          )
            .trim()
            .toLowerCase();

        senderIsSupport =
          supportValue === 'yes';

        senderContactName = [
          senderContact.properties
            ?.firstname,

          senderContact.properties
            ?.lastname,
        ]
          .filter(Boolean)
          .join(' ');

        console.log(
          'app_support_team_member:',
          supportValue ||
            'empty'
        );

      } else {

        console.log(
          'Sender contact not found in HubSpot'
        );
      }
    }


    /*
     * Direction fallback.
     */
    if (!senderContactFound) {

      senderIsSupport =
        latestMessage.direction ===
        'OUTGOING';

      console.log(
        'Using message direction as sender-role fallback'
      );
    }

    /*
     * Existing iOS logic:
     * OUTGOING = support
     * INCOMING = customer
     */
    senderIsSupport =
      latestMessage.direction ===
      'OUTGOING';

    const senderRole =
      senderIsSupport
        ? 'support'
        : 'customer';

    const senderName =
      senderContactName ||
      latestMessage.senders?.[0]
        ?.name ||
      senderEmail ||
      (
        senderIsSupport
          ? 'SYIL Support'
          : 'Customer'
      );

    const notificationTitle =
      senderIsSupport
        ? `New reply from ${senderName}`
        : `New message from ${senderName}`;

    const notificationBody =
      latestMessage.text
        ?.trim() ||
      (
        senderIsSupport
          ? 'You received a new reply from SYIL Support.'
          : 'You received a new customer message.'
      );

    console.log(
      'Sender role:',
      senderRole
    );

    console.log(
      'Sender name:',
      senderName
    );

    console.log(
      'Notification title:',
      notificationTitle
    );


    // ========================================================
    // STEP 8
    // FIND NOTIFICATION RECIPIENT
    // ========================================================

    let dealerRecipients = [];


    // --------------------------------------------------------
    // CASE 1
    // CUSTOMER -> TICKET OWNER
    // --------------------------------------------------------

    if (
      latestMessage.direction ===
      'INCOMING'
    ) {

      console.log(
        'Incoming customer message: finding Ticket Owner'
      );

      if (!ticketOwnerEmail) {

        console.log(
          'Push skipped: Ticket owner email missing'
        );

        return;
      }

      const ownerContactSearchResponse =
        await fetch(
          'https://api.hubapi.com/crm/v3/objects/contacts/search',
          {
            method: 'POST',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              filterGroups: [
                {
                  filters: [
                    {
                      propertyName:
                        'email',

                      operator:
                        'EQ',

                      value:
                        ticketOwnerEmail,
                    },
                  ],
                },
              ],

              properties: [
                'email',
                'firstname',
                'lastname',
                'app_support_team_member',
                'dealer_fcm_token',
              ],

              limit: 1,
            }),
          }
        );

      const ownerContactSearchData =
        await ownerContactSearchResponse.json();

      if (
        !ownerContactSearchResponse.ok
      ) {

        console.error(
          'Ticket owner contact search failed:',
          ownerContactSearchData
        );

        return;
      }

      const ownerContact =
        ownerContactSearchData
          .results?.[0];

      if (!ownerContact) {

        console.log(
          `Push skipped: Contact not found for owner ${ticketOwnerEmail}`
        );

        return;
      }

      const supportValue =
        String(
          ownerContact.properties
            ?.app_support_team_member ||
            ''
        )
          .trim()
          .toLowerCase();

      const token =
        ownerContact.properties
          ?.dealer_fcm_token;

      if (
        supportValue !== 'yes'
      ) {

        console.log(
          `Push skipped: Ticket owner ${ticketOwnerEmail} is not support team member`
        );

        return;
      }

      if (!token) {

        console.log(
          `Push skipped: Ticket owner ${ticketOwnerEmail} has no FCM token`
        );

        return;
      }

      dealerRecipients = [
        {
          contactId:
            String(
              ownerContact.id
            ),

          email:
            String(
              ownerContact.properties
                ?.email || ''
            )
              .trim()
              .toLowerCase(),

          token,

          recipientType:
            'support',

          ownerId:
            String(
              ticketOwnerId
            ),
        },
      ];
    }


    // --------------------------------------------------------
    // CASE 2
    // SUPPORT -> ASSOCIATED DEALER
    // --------------------------------------------------------

    else if (
      latestMessage.direction ===
      'OUTGOING'
    ) {

      console.log(
        'Outgoing support message: finding associated customer contacts'
      );

      const ticketContactsResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}/associations/contacts`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type':
                'application/json',
            },
          }
        );

      const ticketContactsData =
        await ticketContactsResponse.json();

      if (
        !ticketContactsResponse.ok
      ) {

        console.error(
          'Ticket contact association fetch failed:',
          ticketContactsData
        );

        return;
      }

      const associatedContactIds =
        (
          ticketContactsData.results ||
          []
        )
          .map(item =>
            String(item.id)
          )
          .filter(Boolean);

      if (
        !associatedContactIds.length
      ) {

        console.log(
          'Push skipped: No customer associated with ticket'
        );

        return;
      }

      const contactRequests =
        associatedContactIds.map(
          async contactId => {

            const response =
              await fetch(
                `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?properties=email,firstname,lastname,app_support_team_member,dealer_fcm_token`,
                {
                  method: 'GET',

                  headers: {
                    Authorization:
                      `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type':
                      'application/json',
                  },
                }
              );

            const data =
              await response.json();

            if (!response.ok) {
              return null;
            }

            return data;
          }
        );

      const contacts =
        (
          await Promise.all(
            contactRequests
          )
        )
          .filter(Boolean);

      dealerRecipients =
        contacts
          .filter(contact => {

            const supportValue =
              String(
                contact.properties
                  ?.app_support_team_member ||
                  ''
              )
                .trim()
                .toLowerCase();

            const isSupport =
              supportValue === 'yes';

            const hasToken =
              Boolean(
                contact.properties
                  ?.dealer_fcm_token
              );

            return (
              !isSupport &&
              hasToken
            );
          })
          .map(contact => ({
            contactId:
              String(
                contact.id
              ),

            email:
              String(
                contact.properties
                  ?.email || ''
              )
                .trim()
                .toLowerCase(),

            token:
              contact.properties
                ?.dealer_fcm_token,

            recipientType:
              'customer',
          }));
    }


    console.log(
      'Dealer notification recipients:',
      dealerRecipients.map(
        recipient => ({
          contactId:
            recipient.contactId,

          email:
            recipient.email,

          recipientType:
            recipient.recipientType,
        })
      )
    );


    if (
      !dealerRecipients.length
    ) {

      console.log(
        'Push skipped: No eligible recipient'
      );

      return;
    }


    // ========================================================
    // STEP 9
    // SEND FCM PUSH
    // ========================================================

    const pushResults =
      await Promise.allSettled(

        dealerRecipients.map(
          async recipient => {

            let totalUnreadCount =
              0;

            /*
             * Support owner:
             * owner ke tickets ka total.
             */
            if (
              recipient.recipientType ===
              'support'
            ) {

              totalUnreadCount =
                await getSupportOwnerTotalUnreadCount(
                  recipient.ownerId,
                  fetch
                );

            }

            /*
             * Dealer:
             * associated tickets ka total.
             */
            else {

              totalUnreadCount =
                await getDealerTotalUnreadCount(
                  recipient.contactId,
                  fetch
                );
            }

            console.log(
              `Push badge for ${recipient.email}:`,
              totalUnreadCount
            );


            return getMessaging().send({

              token:
                recipient.token,


              notification: {

                title:
                  notificationTitle,

                body:
                  notificationBody.slice(
                    0,
                    200
                  ),
              },


              data: {

                ticketId:
                  String(ticketId),

                threadId:
                  String(threadId),

                messageId:
                  String(
                    latestMessage.id
                  ),

                ticketSubject:
                  String(
                    ticketSubject
                  ),

                senderEmail:
                  String(
                    senderEmail
                  ),

                senderRole:
                  String(
                    senderRole
                  ),

                appSupportTeamMember:
                  senderIsSupport
                    ? 'Yes'
                    : 'No',

                direction:
                  String(
                    latestMessage.direction
                  ),

                targetScreen:
                  'ViewTicketDetail',

                type:
                  senderIsSupport
                    ? 'support_message'
                    : 'customer_message',

                /*
                 * Specific ticket unread.
                 */
                ticketUnreadCount:
                  String(
                    newTicketUnreadCount
                  ),

                /*
                 * Total unread.
                 */
                totalUnreadCount:
                  String(
                    totalUnreadCount
                  ),
              },


              /*
               * iOS APNs support.
               * Android is automatically handled
               * by FCM notification above.
               */
              apns: {

                headers: {
                  'apns-priority':
                    '10',
                },

                payload: {

                  aps: {

                    alert: {

                      title:
                        notificationTitle,

                      body:
                        notificationBody.slice(
                          0,
                          200
                        ),
                    },

                    sound:
                      'default',

                    badge:
                      totalUnreadCount,
                  },
                },
              },
            });
          }
        )
      );


    // ========================================================
    // STEP 10
    // PUSH SUMMARY
    // ========================================================

    pushResults.forEach(
      (result, index) => {

        if (
          result.status ===
          'fulfilled'
        ) {

          console.log(
            `Push ${index + 1} success:`,
            result.value
          );

        } else {

          console.error(
            `Push ${index + 1} failed:`,
            {
              code:
                result.reason?.code,

              message:
                result.reason?.message,
            }
          );
        }
      }
    );


    const successCount =
      pushResults.filter(
        result =>
          result.status ===
          'fulfilled'
      ).length;

    const failureCount =
      pushResults.length -
      successCount;


    console.log(
      '========== PUSH SUMMARY =========='
    );

    console.log(
      'Successful:',
      successCount
    );

    console.log(
      'Failed:',
      failureCount
    );


  } catch (error) {

    console.error(
      'HubSpot webhook processing error:',
      {
        code:
          error?.code,

        message:
          error?.message,

        stack:
          error?.stack,
      }
    );
  }
});







// ============================================================
// MARK TICKET AS READ
// ============================================================

app.post(
  '/mark-ticket-read',
  async (req, res) => {

    const {
      ticketId,
      contactId,
    } = req.body;


    console.log(
      '=== mark-ticket-read hit ==='
    );

    console.log(
      'ticketId:',
      ticketId
    );

    console.log(
      'contactId:',
      contactId
    );


    if (
      !ticketId ||
      !contactId
    ) {

      return res.status(400).json({
        success: false,
        message:
          'ticketId and contactId are required',
      });
    }


    try {

      const fetch = (...args) =>
        import('node-fetch').then(
          ({ default: fetch }) =>
            fetch(...args)
        );


      // ======================================================
      // STEP 1
      // VERIFY TICKET BELONGS TO CONTACT
      // ======================================================

      const associationResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/ticket`,
          {
            method: 'GET',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },
          }
        );


      const associationData =
        await associationResponse.json();


      if (
        !associationResponse.ok
      ) {

        console.error(
          'Unable to verify ticket association:',
          associationData
        );

        return res.status(
          associationResponse.status
        ).json({
          success: false,
          message:
            'Unable to verify ticket association',
        });
      }


      const associatedTicketIds =
        (
          associationData.results ||
          []
        )
          .map(item =>
            String(item.id)
          );


      if (
        !associatedTicketIds.includes(
          String(ticketId)
        )
      ) {

        return res.status(403).json({
          success: false,
          message:
            'Ticket is not associated with this contact',
        });
      }


      // ======================================================
      // STEP 2
      // SET CURRENT TICKET UNREAD = 0
      // ======================================================

      const updateResponse =
        await fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}`,
          {
            method: 'PATCH',

            headers: {
              Authorization:
                `Bearer ${HUBSPOT_API_KEY}`,

              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              properties: {
                dealer_unread_count:
                  '0',
              },
            }),
          }
        );


      const updateText =
        await updateResponse.text();


      if (
        !updateResponse.ok
      ) {

        console.error(
          'Mark ticket read error:',
          updateText
        );

        return res.status(
          updateResponse.status
        ).json({
          success: false,
          message:
            'Unable to mark ticket read',
        });
      }


      // ======================================================
      // STEP 3
      // CALCULATE REMAINING TOTAL
      // ======================================================

      const totalUnreadCount =
        await getDealerTotalUnreadCount(
          String(contactId),
          fetch
        );


      console.log(
        `Ticket ${ticketId} marked read. Remaining unread:`,
        totalUnreadCount
      );


      // ======================================================
      // STEP 4
      // RESPONSE
      // ======================================================

      return res.json({

        success: true,

        ticketUnreadCount:
          0,

        totalUnreadCount:
          totalUnreadCount,
      });


    } catch (error) {

      console.error(
        'mark-ticket-read error:',
        error
      );


      return res.status(500).json({
        success: false,
        message:
          'Internal server error',
      });
    }
  }
);







app.post('/get_tickets', async (req, res) => {
  const { contactId, type } = req.body;

  if (!contactId) {
    return res.status(400).json({
      message: 'Contact ID is required',
    });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) => fetch(...args)
      );

    let ticketIds = [];

    // ============================
    // 🔵 OWNED BY ME
    // ============================
    if (type === 'me') {

      const associationResponse = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/ticket`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const associationData =
        await associationResponse.json();

      if (associationData.results) {
        ticketIds =
          associationData.results.map(
            item => item.id
          );
      }
    }

    // ============================
    // 🟢 OWNED BY ORGANIZATION
    // ============================
    if (type === 'org') {

      const contactRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}?associations=companies`,
        {
          method: 'GET',
          headers: {
            'Authorization':
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const contactData =
        await contactRes.json();

      const companies =
        contactData?.associations?.companies?.results || [];

      const company =
        companies.find(
          c => c.type === 'contact_to_company'
        );

      if (!company) {
        return res.status(200).json({
          tickets: [],
        });
      }

      const companyId = company.id;

      const companyRes = await fetch(
        `https://api.hubapi.com/crm/v3/objects/companies/${companyId}?associations=tickets`,
        {
          method: 'GET',
          headers: {
            'Authorization':
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const companyData =
        await companyRes.json();

      const tickets =
        companyData?.associations?.tickets?.results || [];

      ticketIds = tickets
        .filter(
          t => t.type === 'company_to_ticket'
        )
        .map(t => t.id);
    }

    // ============================
    // 🚫 NO TICKETS
    // ============================
    if (!ticketIds.length) {
      return res.status(200).json({
        message: 'No tickets found',
        tickets: [],
      });
    }

    // ============================
    // 🎯 FETCH TICKET DETAILS
    // ============================
    const ticketPromises =
      ticketIds.map(ticketId =>
        fetch(
          `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=subject,createdate,hubspot_owner_id,hs_pipeline_stage,customer_portal,dealer_unread_count`,
          {
            method: 'GET',
            headers: {
              'Authorization':
                `Bearer ${HUBSPOT_API_KEY}`,
              'Content-Type':
                'application/json',
            },
          }
        ).then(res => res.json())
      );

    const ticketResponses =
      await Promise.all(ticketPromises);

    const formattedTickets =
      ticketResponses.map(ticket => ({

        ticketId: ticket.id,

        subject:
          ticket.properties?.subject || '',

        createdDate:
          ticket.properties?.createdate || '',

        ownerId:
          ticket.properties?.hubspot_owner_id || '',

        status:
          ticket.properties?.hs_pipeline_stage || '',

        customer_portal:
          ticket.properties?.customer_portal || '',

        // 🔴 UNREAD COUNT
        dealer_unread_count:
          Number(
            ticket.properties
              ?.dealer_unread_count || 0
          ),
      }));

    return res.status(200).json({
      tickets: formattedTickets,
    });

  } catch (error) {

    console.error(
      'Error:',
      error
    );

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
});



app.post('/get_owner_ticket', async (req, res) => {
  const { ownerId } = req.body;

  if (!ownerId) {
    return res.status(400).json({
      message: 'Owner ID is required',
    });
  }

  try {

    const fetch = (...args) =>
      import('node-fetch').then(
        ({ default: fetch }) => fetch(...args)
      );

    let allTickets = [];
    let after = null;

    do {

      const response = await fetch(
        'https://api.hubapi.com/crm/v3/objects/tickets/search',
        {
          method: 'POST',

          headers: {
            'Authorization':
              `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({

            filterGroups: [
              {
                filters: [
                  {
                    propertyName:
                      'hubspot_owner_id',

                    operator: 'EQ',

                    value: ownerId,
                  },
                ],
              },
            ],

            limit: 100,

            after: after,

            properties: [
              'subject',
              'content',
              'hs_pipeline',
              'hs_pipeline_stage',
              'hubspot_owner_id',
              'createdate',
              'customer_portal',
              'dealer_unread_count',
            ],

            sorts: [
              'createdate',
            ],
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        'data---ticketowner ',
        data
      );

      allTickets = [
        ...allTickets,
        ...(data.results || []),
      ];

      after =
        data?.paging?.next?.after || null;

    } while (after);

    const tickets =
      allTickets.map(item => ({

        ticketId:
          item.id,

        subject:
          item.properties?.subject || '',

        createdDate:
          item.properties?.createdate || '',

        ownerId:
          item.properties?.hubspot_owner_id || '',

        status:
          item.properties?.hs_pipeline_stage || '',

        content:
          item.properties?.content || '',

        customer_portal:
          item.properties?.customer_portal || '',
        dealer_unread_count:
          Number(
            item.properties
              ?.dealer_unread_count || 0
          ),
      }));

    return res.status(200).json({
      message:
        'All owner tickets fetched',

      total:
        tickets.length,

      tickets,
    });

  } catch (error) {

    console.error(
      'Owner Ticket Fetch Error:',
      error
    );

    return res.status(500).json({
      message:
        'Internal server error',
    });
  }
});



app.post('/get-owner-id', async (req, res) => {
  const { email } = req.body;
  console.log('=== get-owner-id hit ===');
  console.log('Email received:', email);

  if (!email) {
    return res.status(400).json({ error: 'Email required' });
  }

  try {
    const response = await axios.get(
      'https://api.hubapi.com/crm/v3/owners?archived=false',
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const owners = response.data.results || [];
    console.log('Total owners found:', owners.length);
    console.log('All owner emails:', owners.map(o => o.email));

    const matchedOwner = owners.find(
      (owner) => owner.email?.toLowerCase() === email?.toLowerCase()
    );

    console.log('Matched owner:', matchedOwner || 'NOT FOUND');

    if (!matchedOwner) {
      return res.status(200).json({ ownerId: null }); // ❌ 404 ki jagah 200 return karo
    }

    return res.status(200).json({ ownerId: matchedOwner.userId, OwnerUserID: matchedOwner.id });

  } catch (err) {
    console.error('Get owner error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Failed to get owner' });
  }
});












//Get Conversation Details
app.post('/get_ticket_conversation', async (req, res) => {
  const { ticketId } = req.body;

  if (!ticketId) {
    return res.status(400).json({ message: 'Ticket ID is required' });
  }

  try {
    const fetch = (...args) =>
      import('node-fetch').then(({ default: fetch }) => fetch(...args));

    // 1️⃣ GET THREAD ID FROM TICKET
    const ticketRes = await fetch(
      `https://api.hubapi.com/crm/v3/objects/tickets/${ticketId}?properties=hs_conversations_originating_thread_id`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const ticketData = await ticketRes.json();
    const threadId =
      ticketData?.properties?.hs_conversations_originating_thread_id;

      console.log('threadId--- ' , threadId);
    if (!threadId) {
      return res.status(200).json({
        messages: [],
      });
    }

    // 2️⃣ GET THREAD MESSAGES
    const msgRes = await fetch(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
        },
      }
    );

    const msgData = await msgRes.json();

    console.log('msgData--- ', msgData.results);  

    // 3️⃣ FORMAT MESSAGES
    const formattedMessages = msgData.results
      .filter(m => m.type === 'MESSAGE')
      .map(m => {
        const sender = m.senders?.[0] || {};
        const email = sender?.deliveryIdentifier?.value || '';
        const name = sender?.name || email;

        return {
          id: m.id,
          direction: m.direction, // INCOMING / OUTGOING
          senderName: name,
          text: m.text || '',
          richText: m.richText || '',
          createdAt: m.createdAt,
          subject : m.subject,
          attachments: m.attachments,
          channelAccountId : m.channelAccountId,
          channelId: m.channelId,
          conversationsThreadId: m.conversationsThreadId,
        };
      });

    return res.status(200).json({
      messages: formattedMessages,
    });

  } catch (err) {
    console.error('Conversation error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});



// app.post('/upload-to-hubspot', upload.array('files'), async (req, res) => {
//   try {
//     const uploadedFiles = [];

//     console.log('req.files--- ', req.files);

//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const formData = new FormData();
//         formData.append('file', fs.createReadStream(file.path));
//         formData.append('fileName', file.originalname);
//         formData.append('folderId', '204201997753');
//         formData.append('options', JSON.stringify({ access: 'PUBLIC_INDEXABLE' }));

//         const response = await axios.post(
//           'https://api.hubapi.com/files/v3/files',
//           formData,
//           {
//             headers: {
//               Authorization: `Bearer ${HUBSPOT_API_KEY}`,
//               ...formData.getHeaders(),
//             },
//           }
//         );

//         uploadedFiles.push({
//           id: response.data.id,
//           url: response.data.url,
//           name: file.originalname,
//         });

//         fs.unlinkSync(file.path); // temp file delete
//       }
//     }

//     res.status(200).json({ files: uploadedFiles });
//   } catch (err) {
//     console.error('Upload error:', err.response?.data || err.message);
//     res.status(500).json({ error: 'File upload failed' });
//   }
// });

// ✅ Send Message to HubSpot Thread


const uploadedFilesForViewTicket = [];
app.post('/upload-to-hubspot-view', hubspotUpload.array('files'), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ success: true, files: [] });
    }
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(file.path));
      formData.append('fileName', file.originalname);
      formData.append('folderId', '204201997753'); 
      formData.append(
        'options',
        JSON.stringify({ access: 'PUBLIC_INDEXABLE' })
      );
      const response = await axios.post(
        'https://api.hubapi.com/files/v3/files',
        formData,
        {
          headers: {
            Authorization: `Bearer ${HUBSPOT_API_KEY}`,
            ...formData.getHeaders(),
          },
        }
      );
      uploadedFilesForViewTicket.push({
        id: response.data.id,
        url: response.data.url,
      });
      fs.unlinkSync(file.path);
    }
    res.json({
      success: true,
      files: uploadedFilesForViewTicket,
    });
    console.log('uploadedFilesForViewTicket--- ', uploadedFilesForViewTicket);
    uploadedFilesForViewTicket.length = 0; 
  } catch (err) {
    console.log(err.response?.data || err);
    res.status(500).json({ error: 'File upload failed' });
  }
});

app.post('/send-hubspot-message', async (req, res) => {
  const { threadId, text, recipientEmail, attachmentIds, channelAccountId, channelId, senderActorId, subject } = req.body;

  console.log('=== send-hubspot-message hit ===');
  console.log('threadId:', threadId);
  console.log('text:', text);
  console.log('recipientEmail:', recipientEmail);
  console.log('attachmentIds:', attachmentIds);
  console.log('channelAccountId:', channelAccountId);
  console.log('channelId:', channelId);
  console.log('senderActorId received:', senderActorId);
  console.log('subject:', subject);

  try {
    // ✅ Postman format exactly match
    const body = {
      type: 'MESSAGE',
      text: text,
      subject: subject,
      senderActorId: senderActorId,
      channelId: '1002',
      channelAccountId: '597383280',
      recipients: [
        {
          recipientField: 'TO',
          deliveryIdentifiers: [
            { type: 'HS_EMAIL_ADDRESS', value: recipientEmail },
          ],
        },
      ],
    };

    // ✅ Attachments sirf tab add karo jab hain
    if (attachmentIds && attachmentIds.length > 0) {
      body.attachments = attachmentIds.map((id) => ({ fileId: String(id) }));
    }

    console.log('Final body HubSpot ko ja raha hai:', JSON.stringify(body, null, 2));

    const response = await axios.post(
      `https://api.hubapi.com/conversations/v3/conversations/threads/${threadId}/messages`,
      body,
      {
        headers: {
          Authorization: `Bearer ${HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ HubSpot response:', response.data);
    return res.status(200).json({ success: true, data: response.data });

  } catch (err) {
    console.error('❌ Send message error:', err.response?.data || err.message);
    return res.status(500).json({ error: 'Message send failed', detail: err.response?.data });
  }
});

 


app.listen(PORT,'0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));


app.listen(PORT, () => console.log(`Server running on ${PORT}`));
// app.listen(PORT,'0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));