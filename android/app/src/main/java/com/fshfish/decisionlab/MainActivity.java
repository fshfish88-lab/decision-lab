package com.fshfish.decisionlab;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareCardPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
