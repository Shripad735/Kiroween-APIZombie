import APIRequest from '../models/APIRequest.js';
import Workflow from '../models/Workflow.js';

/**
 * Save an API request
 * POST /api/saved/requests
 */
export const saveRequest = async (req, res) => {
  try {
    const requestData = req.body;

    // Validate required fields
    if (!requestData.protocol || !requestData.endpoint) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Protocol and endpoint are required',
        },
      });
    }

    // Create new saved request
    const savedRequest = new APIRequest({
      ...requestData,
      userId: requestData.userId || 'default-user',
    });

    await savedRequest.save();

    res.status(201).json({
      success: true,
      data: savedRequest,
      message: 'Request saved successfully',
    });
  } catch (error) {
    console.error('Error saving request:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_REQUEST_FAILED',
        message: 'Failed to save request',
        details: error.message,
      },
    });
  }
};

/**
 * Get saved requests with search and filter
 * GET /api/saved/requests
 * Query params: search, protocol, tags, page, limit
 */
export const getSavedRequests = async (req, res) => {
  try {
    const {
      search,
      protocol,
      tags,
      page = 1,
      limit = 20,
      userId = 'default-user',
    } = req.query;

    // Build query
    const query = { userId };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { endpoint: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by protocol
    if (protocol) {
      query.protocol = protocol;
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await APIRequest.countDocuments(query);

    // Execute query
    const requests = await APIRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('apiSpecId', 'name type');

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching saved requests:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_REQUESTS_FAILED',
        message: 'Failed to fetch saved requests',
        details: error.message,
      },
    });
  }
};

/**
 * Save a workflow
 * POST /api/saved/workflows
 */
export const saveWorkflow = async (req, res) => {
  try {
    const workflowData = req.body;

    // Validate required fields
    if (!workflowData.name || !workflowData.steps || workflowData.steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORKFLOW',
          message: 'Workflow name and at least one step are required',
        },
      });
    }

    // Create new workflow
    const workflow = new Workflow({
      ...workflowData,
      userId: workflowData.userId || 'default-user',
    });

    await workflow.save();

    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow saved successfully',
    });
  } catch (error) {
    console.error('Error saving workflow:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SAVE_WORKFLOW_FAILED',
        message: 'Failed to save workflow',
        details: error.message,
      },
    });
  }
};

/**
 * Get saved workflows with search and filter
 * GET /api/saved/workflows
 * Query params: search, tags, isTemplate, page, limit
 */
export const getSavedWorkflows = async (req, res) => {
  try {
    const {
      search,
      tags,
      isTemplate,
      page = 1,
      limit = 20,
      userId = 'default-user',
    } = req.query;

    // Build query
    const query = { userId };

    // Search by name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by tags
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    // Filter by template status
    if (isTemplate !== undefined) {
      query.isTemplate = isTemplate === 'true';
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Workflow.countDocuments(query);

    // Execute query
    const workflows = await Workflow.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: workflows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching saved workflows:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_WORKFLOWS_FAILED',
        message: 'Failed to fetch saved workflows',
        details: error.message,
      },
    });
  }
};

/**
 * Export saved items to JSON
 * POST /api/saved/export
 * Body: { type: 'requests' | 'workflows' | 'all', ids?: string[] }
 */
export const exportSavedItems = async (req, res) => {
  try {
    const { type = 'all', ids, userId = 'default-user' } = req.body;

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {},
    };

    // Export requests
    if (type === 'requests' || type === 'all') {
      const query = { userId };
      if (ids && ids.length > 0) {
        query._id = { $in: ids };
      }
      const requests = await APIRequest.find(query).lean();
      exportData.data.requests = requests;
    }

    // Export workflows
    if (type === 'workflows' || type === 'all') {
      const query = { userId };
      if (ids && ids.length > 0) {
        query._id = { $in: ids };
      }
      const workflows = await Workflow.find(query).lean();
      exportData.data.workflows = workflows;
    }

    res.json({
      success: true,
      data: exportData,
      message: 'Items exported successfully',
    });
  } catch (error) {
    console.error('Error exporting items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXPORT_FAILED',
        message: 'Failed to export items',
        details: error.message,
      },
    });
  }
};

/**
 * Import saved items from JSON
 * POST /api/saved/import
 * Body: { data: exportData }
 */
export const importSavedItems = async (req, res) => {
  try {
    const { data, userId = 'default-user' } = req.body;

    if (!data || !data.data) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IMPORT_DATA',
          message: 'Invalid import data format',
        },
      });
    }

    const results = {
      requests: { imported: 0, failed: 0 },
      workflows: { imported: 0, failed: 0 },
    };

    // Import requests
    if (data.data.requests && Array.isArray(data.data.requests)) {
      for (const requestData of data.data.requests) {
        try {
          // Remove _id and timestamps to create new documents
          const { _id, createdAt, updatedAt, __v, ...cleanData } = requestData;
          const request = new APIRequest({
            ...cleanData,
            userId,
          });
          await request.save();
          results.requests.imported++;
        } catch (error) {
          console.error('Failed to import request:', error);
          results.requests.failed++;
        }
      }
    }

    // Import workflows
    if (data.data.workflows && Array.isArray(data.data.workflows)) {
      for (const workflowData of data.data.workflows) {
        try {
          // Remove _id and timestamps to create new documents
          const { _id, createdAt, updatedAt, __v, ...cleanData } = workflowData;
          const workflow = new Workflow({
            ...cleanData,
            userId,
          });
          await workflow.save();
          results.workflows.imported++;
        } catch (error) {
          console.error('Failed to import workflow:', error);
          results.workflows.failed++;
        }
      }
    }

    res.json({
      success: true,
      data: results,
      message: 'Import completed',
    });
  } catch (error) {
    console.error('Error importing items:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'IMPORT_FAILED',
        message: 'Failed to import items',
        details: error.message,
      },
    });
  }
};
