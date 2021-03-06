package com.composum.sling.core.console;

import com.composum.sling.core.AbstractServletBean;
import com.composum.sling.core.BeanContext;
import com.composum.sling.core.util.LinkMapper;
import com.composum.sling.core.util.LinkUtil;
import org.apache.sling.api.resource.Resource;

public class ConsoleServletBean extends AbstractServletBean {

    public ConsoleServletBean(BeanContext context, Resource resource) {
        super(context, resource);
    }

    public ConsoleServletBean(BeanContext context) {
        super(context);
    }

    public ConsoleServletBean() {
        super();
    }

    @Override
    public void initialize(BeanContext context, Resource resource) {
        super.initialize(context, resource);
        context.getRequest().setAttribute(LinkUtil.LINK_MAPPER, LinkMapper.CONTEXT);
    }
}
