<%@page session="false" pageEncoding="utf-8"%>
<%@taglib prefix="sling" uri="http://sling.apache.org/taglibs/sling/1.2"%>
<%@taglib prefix="cpn" uri="http://sling.composum.com/cpnl/1.0"%>
<sling:defineObjects />
<cpn:component id="browser" type="com.composum.sling.core.browser.Browser" scope="request">
    <div class="table-container">
        <table id="browser-view-version-table" class="version-table"
               data-path="${browser.current.pathEncoded}">
        </table>
    </div>
</cpn:component>
