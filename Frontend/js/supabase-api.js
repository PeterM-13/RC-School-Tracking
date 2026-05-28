(function () {
  const config = window.RC_SUPABASE_CONFIG || {};

  if (!window.supabase) {
    throw new Error('Supabase client library is not loaded.');
  }

  if (!config.url || !config.anonKey || config.url.includes('YOUR-PROJECT-REF')) {
    console.warn('Supabase config is using placeholder values. Update Frontend/js/supabase-config.js.');
  }

  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  async function rpc(functionName, params = {}) {
    const { data, error } = await client.rpc(functionName, params);
    if (error) {
      throw error;
    }
    return data;
  }

  async function uploadRoadmapImage(filePath, file) {
    const { data, error } = await client.storage
      .from('Roadmap-Images')
      .upload(filePath, file, {
        cacheControl: '3600',
        contentType: file.type || 'application/octet-stream',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = client.storage
      .from('Roadmap-Images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }

  window.RcApi = {
    getSchoolNames() {
      return rpc('get_school_names');
    },

    verifySchoolPassword(name, password) {
      return rpc('verify_school_password', {
        p_name: name,
        p_password: password
      });
    },

    getSchoolProgress(name, password) {
      return rpc('get_school_progress', {
        p_name: name,
        p_password: password
      });
    },

    listSchoolProgress({ name = null, password = null, adminKey = null } = {}) {
      return rpc('list_school_progress', {
        p_name: name,
        p_password: password,
        p_admin_key: adminKey
      });
    },

    createSchool(adminKey, name, password) {
      return rpc('create_school', {
        p_admin_key: adminKey,
        p_name: name,
        p_password: password
      });
    },

    deleteSchool(adminKey, name, password) {
      return rpc('delete_school', {
        p_admin_key: adminKey,
        p_name: name,
        p_password: password
      });
    },

    updateSchoolProgress(name, password, progress) {
      return rpc('update_school_progress', {
        p_name: name,
        p_password: password,
        p_progress: progress
      });
    },

    uploadRoadmapImage(filePath, file) {
      return uploadRoadmapImage(filePath, file);
    },

    updateRoadmapImage(adminKey, stepIndex, imageUrl) {
      return rpc('update_roadmap_image', {
        p_admin_key: adminKey,
        p_step_index: stepIndex,
        p_img_url: imageUrl
      });
    },

    resetAllProgress(adminKey) {
      return rpc('reset_all_progress', {
        p_admin_key: adminKey
      });
    },

    getComments(schoolName, schoolKey) {
      return rpc('get_comments', {
        p_school_name: schoolName,
        p_school_key: schoolKey
      });
    },

    addComment(schoolName, schoolKey, text, adminKey = null) {
      return rpc('add_comment', {
        p_school_name: schoolName,
        p_school_key: schoolKey,
        p_text: text,
        p_admin_key: adminKey
      });
    },

    deleteComment(schoolName, schoolKey, commentIndex, adminKey) {
      return rpc('delete_comment', {
        p_school_name: schoolName,
        p_school_key: schoolKey,
        p_comment_index: commentIndex,
        p_admin_key: adminKey
      });
    },

    markCommentViewed(schoolName, schoolKey, msgIndex) {
      return rpc('mark_comment_viewed', {
        p_school_name: schoolName,
        p_school_key: schoolKey,
        p_msg_index: msgIndex
      });
    },

    getUnviewedComments(adminKey, sentBy = null) {
      return rpc('get_unviewed_comments', {
        p_admin_key: adminKey,
        p_sent_by: sentBy
      });
    }
  };
})();
